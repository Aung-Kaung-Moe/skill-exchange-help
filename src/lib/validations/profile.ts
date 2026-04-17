import { z } from "zod";

export const studentProfileSchema = z.object({
  username: z.string().trim().default(""),
  university: z
    .string()
    .trim()
    .default(""),
  major: z.string().trim().default(""),
  year: z.preprocess(
    (value) => {
      const raw = typeof value === "string" ? value.trim() : "";
      if (!raw) return 1;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return 1;
      const floored = Math.floor(parsed);
      return floored < 1 ? 1 : floored;
    },
    z
      .number()
      .int()
      .min(1)
  ),
  bio: z.string().trim().default(""),
  location: z
    .string()
    .trim()
    .default(""),
  preferredSessionMode: z.preprocess(
    (value) => {
      if (value === "online" || value === "in_person" || value === "both") {
        return value;
      }
      return "both";
    },
    z.enum(["online", "in_person", "both"])
  ),
  avatarUrl: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      return value.trim();
    },
    z.string().optional()
  )
});
