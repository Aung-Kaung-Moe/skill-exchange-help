import { z } from "zod";

export const chatMessageSchema = z.object({
  content: z
    .string({
      required_error: "Message is required."
    })
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message must be at most 2000 characters.")
});
