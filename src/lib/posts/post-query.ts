import {
  postModeSchema,
  postSortSchema,
  postStatusSchema,
  postTypeSchema,
  type SkillPostFilterInput
} from "@/lib/validations/post";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function cleanText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanKeyword(value: string | undefined): string | undefined {
  const keyword = cleanText(value);
  if (!keyword) {
    return undefined;
  }

  return keyword.slice(0, 100);
}

export function parsePostListFilters(rawSearchParams: RawSearchParams): SkillPostFilterInput {
  const rawType = cleanText(firstValue(rawSearchParams.type));
  const rawMode = cleanText(firstValue(rawSearchParams.mode));
  const rawStatus = cleanText(firstValue(rawSearchParams.status));
  const rawSort = cleanText(firstValue(rawSearchParams.sort));
  const rawUniversity = cleanText(firstValue(rawSearchParams.university));
  const rawKeyword = cleanKeyword(firstValue(rawSearchParams.q));

  const type = rawType ? postTypeSchema.safeParse(rawType) : null;
  const preferredMode = rawMode ? postModeSchema.safeParse(rawMode) : null;
  const status = rawStatus ? postStatusSchema.safeParse(rawStatus) : null;
  const sort = postSortSchema.safeParse(rawSort ?? "newest");

  return {
    q: rawKeyword,
    type: type?.success ? type.data : undefined,
    preferredMode: preferredMode?.success ? preferredMode.data : undefined,
    university: rawUniversity,
    status: status?.success ? status.data : undefined,
    sort: sort.success ? sort.data : "newest"
  };
}
