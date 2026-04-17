import { z } from "zod";

export const postTypeSchema = z.enum(["offer", "request"], {
  errorMap: () => ({ message: "Please choose a valid post type." })
});

export const postModeSchema = z.enum(["online", "in_person", "both"], {
  errorMap: () => ({ message: "Please choose a valid preferred mode." })
});

export const postStatusSchema = z.enum(["open", "closed"], {
  errorMap: () => ({ message: "Please choose a valid status." })
});

export const postSortSchema = z.enum(["newest", "oldest"], {
  errorMap: () => ({ message: "Please choose a valid sort order." })
});

export const skillPostSchema = z.object({
  type: postTypeSchema,
  title: z
    .string({
      required_error: "Title is required."
    })
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be at most 120 characters."),
  description: z
    .string({
      required_error: "Description is required."
    })
    .trim()
    .min(1, "Description is required.")
    .max(2000, "Description must be at most 2000 characters."),
  skillName: z
    .string({
      required_error: "Skill name is required."
    })
    .trim()
    .min(1, "Skill name is required.")
    .max(80, "Skill name must be at most 80 characters."),
  preferredMode: postModeSchema,
  status: postStatusSchema
});

export type SkillPostFilterInput = {
  q?: string;
  type?: z.infer<typeof postTypeSchema>;
  preferredMode?: z.infer<typeof postModeSchema>;
  university?: string;
  status?: z.infer<typeof postStatusSchema>;
  sort: z.infer<typeof postSortSchema>;
};
