export type ZoomLinkIssue = "invalid_url" | "not_zoom" | "invalid_format" | "placeholder_id";

const KNOWN_PLACEHOLDER_IDS = new Set([
  "123456789",
  "1234567890",
  "12345678901",
  "987654321",
  "9876543210",
  "111111111",
  "222222222",
  "333333333",
  "444444444",
  "555555555",
  "666666666",
  "777777777",
  "888888888",
  "999999999",
  "000000000"
]);

function isZoomHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "zoom.us" || normalized.endsWith(".zoom.us");
}

function isConsecutiveDigits(meetingId: string, direction: 1 | -1) {
  for (let index = 1; index < meetingId.length; index += 1) {
    const prev = Number(meetingId[index - 1]);
    const current = Number(meetingId[index]);
    const expected = (prev + direction + 10) % 10;

    if (current !== expected) {
      return false;
    }
  }

  return true;
}

function hasRepeatedChunk(meetingId: string) {
  for (let size = 1; size <= Math.floor(meetingId.length / 2); size += 1) {
    if (meetingId.length % size !== 0) {
      continue;
    }

    const chunk = meetingId.slice(0, size);
    if (chunk.repeat(meetingId.length / size) === meetingId) {
      return true;
    }
  }

  return false;
}

export function isClearlyPlaceholderMeetingId(meetingId: string) {
  if (!/^\d{9,12}$/.test(meetingId)) {
    return true;
  }

  if (KNOWN_PLACEHOLDER_IDS.has(meetingId)) {
    return true;
  }

  if (/^(\d)\1+$/.test(meetingId)) {
    return true;
  }

  if (isConsecutiveDigits(meetingId, 1) || isConsecutiveDigits(meetingId, -1)) {
    return true;
  }

  if (hasRepeatedChunk(meetingId)) {
    return true;
  }

  return false;
}

export function extractZoomMeetingId(link: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(link);
  } catch {
    return null;
  }

  const path = parsed.pathname;
  const directMeetingMatch = path.match(/^\/j\/(\d{9,12})\/?$/);
  const webClientMeetingMatch = path.match(/^\/wc\/join\/(\d{9,12})\/?$/);
  return directMeetingMatch?.[1] ?? webClientMeetingMatch?.[1] ?? null;
}

export function validateZoomMeetingLink(link: string):
  | { ok: true; meetingId: string }
  | { ok: false; issue: ZoomLinkIssue } {
  const trimmed = link.trim();
  if (!trimmed) {
    return { ok: false, issue: "invalid_url" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, issue: "invalid_url" };
  }

  if (!isZoomHost(parsed.hostname)) {
    return { ok: false, issue: "not_zoom" };
  }

  const meetingId = extractZoomMeetingId(trimmed);
  if (!meetingId) {
    return { ok: false, issue: "invalid_format" };
  }

  if (isClearlyPlaceholderMeetingId(meetingId)) {
    return { ok: false, issue: "placeholder_id" };
  }

  return { ok: true, meetingId };
}
