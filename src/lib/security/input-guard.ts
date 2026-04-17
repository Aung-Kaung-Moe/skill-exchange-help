import { validateZoomMeetingLink } from "@/lib/security/zoom-link";

type GuardField = "title" | "skillName" | "description" | "message" | "meetingLocation" | "meetingLink";

type GuardIssue = {
  field: GuardField;
  message: string;
};

type GuardResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

type PostGuardInput = {
  title: string;
  skillName: string;
  description: string;
};

type BookingGuardInput = {
  message: string;
  sessionMode: "online" | "in_person" | "both";
  meetingLocation: string;
  meetingLink: string;
};

type OpenAIGuardIssue = {
  field: GuardField;
  reason: string;
};

type OpenAIGuardResponse = {
  allow: boolean;
  issues?: OpenAIGuardIssue[];
};

const XSS_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /<\s*iframe\b/i
];

const SQLI_PATTERNS: RegExp[] = [
  /('|")\s*or\s+1\s*=\s*1/i,
  /\bunion\s+select\b/i,
  /;\s*(drop|truncate|delete|insert|update|select)\b/i,
  /--/,
  /\/\*/
];

const INAPPROPRIATE_CONTENT_PATTERNS: RegExp[] = [
  /\b(fuck|fucking|motherfucker|bitch|blowjob|handjob|porn|xnxx|xvideos|nude|naked|horny|bdsm|escort)\b/i,
  /\b(i\s*need\s*sex|want\s*sex|touch\s*me|make\s*me\s*feel\s*good|send\s*nudes?)\b/i,
  /\b(fuck\s*you|wanna\s*fuck|want\s*to\s*fuck)\b/i,
  /\b(hookup|one[-\s]?night|date\s*me)\b/i
];

function normalizeText(value: string): string {
  return value.trim();
}

function looksSuspiciousPayload(value: string) {
  return [...XSS_PATTERNS, ...SQLI_PATTERNS].some((pattern) => pattern.test(value));
}

function containsInappropriateContent(value: string) {
  return INAPPROPRIATE_CONTENT_PATTERNS.some((pattern) => pattern.test(value));
}

function looksLikeHighNoiseGibberish(value: string) {
  const text = normalizeText(value);

  if (text.length < 8) {
    return false;
  }

  if (/(.)\1{5,}/u.test(text)) {
    return true;
  }

  const chars = [...text];
  const letterOrDigit = chars.filter((ch) => /\p{L}|\p{N}/u.test(ch)).length;
  const symbolCount = chars.length - letterOrDigit;
  const uniqueCharRatio = new Set(chars).size / chars.length;

  if (letterOrDigit === 0) {
    return true;
  }

  if (symbolCount / chars.length > 0.45) {
    return true;
  }

  if (uniqueCharRatio < 0.25) {
    return true;
  }

  return false;
}

function isMostlyLatinText(value: string) {
  const letters = [...value].filter((ch) => /\p{L}/u.test(ch));
  if (letters.length === 0) {
    return false;
  }

  const latinLetters = letters.filter((ch) => /\p{Script=Latin}/u.test(ch));
  return latinLetters.length / letters.length >= 0.7;
}

function hasRepeatedChunkPattern(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.length < 6) {
    return false;
  }

  for (let chunkSize = 1; chunkSize <= Math.floor(normalized.length / 2); chunkSize += 1) {
    if (normalized.length % chunkSize !== 0) {
      continue;
    }

    const chunk = normalized.slice(0, chunkSize);
    if (chunk.repeat(normalized.length / chunkSize) === normalized) {
      return true;
    }
  }

  return false;
}

function hasLongConsonantRun(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) {
    return false;
  }

  return /[bcdfghjklmnpqrstvwxz]{4,}/.test(normalized);
}

function hasLowVowelRatio(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.length < 6) {
    return false;
  }

  const vowels = (normalized.match(/[aeiouy]/g) ?? []).length;
  return vowels / normalized.length < 0.24;
}

function countWords(value: string) {
  return normalizeText(value).split(/\s+/).filter(Boolean).length;
}

function toFieldErrors(issues: GuardIssue[]) {
  const fieldErrors: Record<string, string[] | undefined> = {};

  for (const issue of issues) {
    fieldErrors[issue.field] = [...(fieldErrors[issue.field] ?? []), issue.message];
  }

  return fieldErrors;
}

function ensureZoomMeetingLink(link: string): GuardIssue | null {
  const trimmed = normalizeText(link);
  if (!trimmed) {
    return null;
  }

  const result = validateZoomMeetingLink(trimmed);
  if (result.ok) {
    return null;
  }

  switch (result.issue) {
    case "invalid_url":
      return {
        field: "meetingLink",
        message: "Please provide a valid Zoom meeting URL."
      };
    case "not_zoom":
      return {
        field: "meetingLink",
        message: "Only Zoom meeting links (zoom.us) are allowed."
      };
    case "invalid_format":
      return {
        field: "meetingLink",
        message:
          "Please provide a valid Zoom meeting link format like https://zoom.us/j/123456789."
      };
    case "placeholder_id":
      return {
        field: "meetingLink",
        message:
          "This Zoom meeting ID looks like a placeholder. Please provide a real meeting link."
      };
    default:
      return {
        field: "meetingLink",
        message: "Please provide a valid Zoom meeting link."
      };
  }
}

function collectDeterministicPostIssues(input: PostGuardInput): GuardIssue[] {
  const issues: GuardIssue[] = [];

  const entries: Array<{ field: GuardField; value: string; gibberish: boolean }> = [
    { field: "title", value: input.title, gibberish: true },
    { field: "skillName", value: input.skillName, gibberish: true },
    { field: "description", value: input.description, gibberish: false }
  ];

  for (const entry of entries) {
    const value = normalizeText(entry.value);
    if (!value) {
      continue;
    }

    if (looksSuspiciousPayload(value)) {
      issues.push({
        field: entry.field,
        message: "This input looks unsafe. Please remove scripts or SQL-like content."
      });
      continue;
    }

    if (containsInappropriateContent(value)) {
      issues.push({
        field: entry.field,
        message:
          "This platform is for educational skill exchange. Sexual or abusive content is not allowed."
      });
      continue;
    }

    if (entry.gibberish && looksLikeHighNoiseGibberish(value)) {
      issues.push({
        field: entry.field,
        message: "Please use clear and meaningful text."
      });
    }

    if (isMostlyLatinText(value)) {
      if (hasRepeatedChunkPattern(value)) {
        issues.push({
          field: entry.field,
          message: "Please avoid repeated random patterns."
        });
      }

      if (hasLongConsonantRun(value) || hasLowVowelRatio(value)) {
        issues.push({
          field: entry.field,
          message: "This looks like gibberish. Please use meaningful words."
        });
      }
    }
  }

  if (isMostlyLatinText(input.title)) {
    const titleWords = countWords(input.title);
    if (titleWords < 2 && normalizeText(input.title).length < 8) {
      issues.push({
        field: "title",
        message: "Please provide a more descriptive title."
      });
    }
  }

  if (isMostlyLatinText(input.skillName)) {
    if (countWords(input.skillName) < 1 || normalizeText(input.skillName).length < 3) {
      issues.push({
        field: "skillName",
        message: "Please provide a valid skill name."
      });
    }
  }

  if (isMostlyLatinText(input.description)) {
    const description = normalizeText(input.description);
    if (countWords(description) < 3 || description.length < 12) {
      issues.push({
        field: "description",
        message: "Description is too short or unclear. Please add meaningful details."
      });
    }
  }

  return issues;
}

function collectDeterministicBookingIssues(input: BookingGuardInput): GuardIssue[] {
  const issues: GuardIssue[] = [];
  const message = normalizeText(input.message);

  if (looksSuspiciousPayload(message)) {
    issues.push({
      field: "message",
      message: "This message looks unsafe. Please remove scripts or SQL-like content."
    });
  }

  if (containsInappropriateContent(message)) {
    issues.push({
      field: "message",
      message:
        "This platform is for educational skill exchange. Sexual or abusive content is not allowed."
    });
  }

  if (looksLikeHighNoiseGibberish(message)) {
    issues.push({
      field: "message",
      message: "Please provide a clear and meaningful request message."
    });
  }

  if (isMostlyLatinText(message)) {
    if (hasRepeatedChunkPattern(message)) {
      issues.push({
        field: "message",
        message: "Please avoid repeated random patterns in your message."
      });
    }

    if (hasLongConsonantRun(message) || hasLowVowelRatio(message)) {
      issues.push({
        field: "message",
        message: "This message looks like gibberish. Please use meaningful words."
      });
    }

    if (countWords(message) < 3 || message.length < 12) {
      issues.push({
        field: "message",
        message: "Please provide more details about your learning request."
      });
    }
  }

  if (input.sessionMode === "in_person") {
    const location = normalizeText(input.meetingLocation);

    if (looksSuspiciousPayload(location)) {
      issues.push({
        field: "meetingLocation",
        message: "Meeting location contains unsafe content."
      });
    }

    if (containsInappropriateContent(location)) {
      issues.push({
        field: "meetingLocation",
        message:
          "This platform is for educational skill exchange. Please provide a professional location."
      });
    }

    if (looksLikeHighNoiseGibberish(location)) {
      issues.push({
        field: "meetingLocation",
        message: "Please provide a real and clear meeting location."
      });
    }
  }

  if (input.sessionMode === "online") {
    const zoomIssue = ensureZoomMeetingLink(input.meetingLink);
    if (zoomIssue) {
      issues.push(zoomIssue);
    }
  }

  return issues;
}

function shouldFailClosedWhenAIUnavailable() {
  return process.env.OPENAI_GUARD_FAIL_CLOSED?.trim().toLowerCase() === "true";
}

function stripCodeFences(value: string) {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractOpenAIText(payload: unknown): string {
  const data = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return stripCodeFences(data.output_text);
  }

  const textFromOutput =
    data.output
      ?.flatMap((entry) => entry.content ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  return stripCodeFences(textFromOutput);
}

async function runOpenAIGuard(
  useCase: "post" | "booking",
  payload: Record<string, string>
): Promise<OpenAIGuardIssue[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const model = process.env.OPENAI_GUARD_MODEL?.trim() || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );

  const instructions =
    useCase === "post"
      ? "Validate a student skill-post input. Reject if content is unsafe (xss/sqli style payload), clearly gibberish, obscene/spam, or not meaningful for campus skill exchange."
      : "Validate a booking-request input. Reject if content is unsafe (xss/sqli style payload), gibberish, non-educational/inappropriate, or if in-person location is clearly fake/meaningless. For online requests, reject invalid or suspicious Zoom links, including gibberish meeting IDs.";

  const prompt = `
You are an input safety validator for a student platform.
${instructions}

Rules:
- Detect suspicious injections and scripts.
- Detect obvious gibberish / keyboard mashing.
- Detect non-educational, sexual, abusive, or inappropriate intent.
- For meetingLocation (if present), reject obviously fake/non-place nonsense.
- For meetingLink (if present), ensure it is a realistic Zoom meeting link.
- Return STRICT JSON only:
{
  "allow": boolean,
  "issues": [{"field":"title|skillName|description|message|meetingLocation|meetingLink","reason":"short reason"}]
}
- If allow is true, issues can be [].

Input JSON:
${JSON.stringify(payload)}
`.trim();

  const response = await fetch(
    `${baseUrl}/responses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: prompt
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const rawError = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    const message = rawError?.error?.message ?? "OpenAI guard request failed";
    throw new Error(`${message} (status ${response.status})`);
  }

  const raw = await response.json();
  const jsonText = extractOpenAIText(raw);
  const parsed = JSON.parse(jsonText) as OpenAIGuardResponse;

  if (parsed.allow) {
    return [];
  }

  return (parsed.issues ?? [])
    .filter((issue) => Boolean(issue.field) && Boolean(issue.reason))
    .map((issue) => ({
      field: issue.field,
      reason: issue.reason
    }));
}

export async function guardPostInput(input: PostGuardInput): Promise<GuardResult> {
  const issues = collectDeterministicPostIssues(input);

  if (issues.length > 0) {
    return {
      ok: false,
      message: "Please correct unsafe or invalid content in your post.",
      fieldErrors: toFieldErrors(issues)
    };
  }

  try {
    const aiIssues = await runOpenAIGuard("post", {
      title: input.title,
      skillName: input.skillName,
      description: input.description
    });

    if (aiIssues.length > 0) {
      return {
        ok: false,
        message: "Your post content looks invalid or unsafe. Please revise and try again.",
        fieldErrors: toFieldErrors(
          aiIssues.map((issue) => ({
            field: issue.field,
            message: issue.reason
          }))
        )
      };
    }
  } catch (error) {
    console.error("[InputGuard] OpenAI post guard unavailable:", error);

    if (shouldFailClosedWhenAIUnavailable()) {
      return {
        ok: false,
        message: "AI safety check is temporarily unavailable. Please try again."
      };
    }
    // Fail-open by default: keep deterministic validation active even if AI is down.
    return { ok: true };
  }

  return { ok: true };
}

export async function guardBookingInput(input: BookingGuardInput): Promise<GuardResult> {
  const issues = collectDeterministicBookingIssues(input);

  if (issues.length > 0) {
    return {
      ok: false,
      message: "Please correct unsafe or invalid booking details.",
      fieldErrors: toFieldErrors(issues)
    };
  }

  const aiPayload: Record<string, string> = {
    message: input.message,
    sessionMode: input.sessionMode
  };

  if (input.sessionMode === "in_person") {
    aiPayload.meetingLocation = input.meetingLocation;
  }

  if (input.sessionMode === "online") {
    aiPayload.meetingLink = input.meetingLink;
  }

  try {
    const aiIssues = await runOpenAIGuard("booking", aiPayload);

    if (aiIssues.length > 0) {
      return {
        ok: false,
        message: "Your booking details look invalid or unsafe. Please revise and try again.",
        fieldErrors: toFieldErrors(
          aiIssues.map((issue) => ({
            field: issue.field,
            message: issue.reason
          }))
        )
      };
    }
  } catch (error) {
    console.error("[InputGuard] OpenAI booking guard unavailable:", error);

    if (shouldFailClosedWhenAIUnavailable()) {
      return {
        ok: false,
        message: "AI safety check is temporarily unavailable. Please try again."
      };
    }
    // Fail-open by default: keep deterministic validation active even if AI is down.
    return { ok: true };
  }

  return { ok: true };
}
