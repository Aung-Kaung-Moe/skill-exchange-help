import { z } from "zod";
import { postModeSchema } from "@/lib/validations/post";
import { validateZoomMeetingLink } from "@/lib/security/zoom-link";

export const bookingStatusSchema = z.enum(
  ["pending", "accepted", "rejected", "cancelled", "completed"],
  {
    errorMap: () => ({ message: "Please choose a valid booking status." })
  }
);

export const createBookingSchema = z.object({
  message: z
    .string({
      required_error: "Message is required."
    })
    .trim()
    .min(1, "Message is required.")
    .max(1000, "Message must be at most 1000 characters."),
  proposedDate: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    },
    z.date({
      required_error: "Please provide a proposed date and time.",
      invalid_type_error: "Please provide a valid proposed date and time."
    })
  ),
  durationMinutes: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      return Number(trimmed);
    },
    z
      .number({
        required_error: "Duration is required.",
        invalid_type_error: "Duration must be a valid number."
      })
      .int("Duration must be a whole number.")
      .min(15, "Duration must be at least 15 minutes.")
      .max(480, "Duration must be at most 480 minutes.")
  ),
  sessionMode: postModeSchema,
  meetingLocation: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return "";
      }

      return value.trim();
    },
    z.string()
  ),
  meetingLink: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return "";
      }

      return value.trim();
    },
    z.string()
  )
}).superRefine((value, context) => {
  if (value.sessionMode === "in_person" && value.meetingLocation.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingLocation"],
      message: "Meeting location is required for in-person sessions."
    });
  }

  if (value.sessionMode === "online") {
    if (value.meetingLink.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meetingLink"],
        message: "Zoom link is required for online sessions."
      });
    } else {
      const zoomCheck = validateZoomMeetingLink(value.meetingLink);
      if (!zoomCheck.ok) {
        const message =
          zoomCheck.issue === "invalid_url"
            ? "Please provide a valid Zoom link URL."
            : zoomCheck.issue === "not_zoom"
              ? "Only Zoom meeting links (zoom.us) are allowed."
              : zoomCheck.issue === "invalid_format"
                ? "Use a direct Zoom meeting link like https://zoom.us/j/123456789."
                : "This Zoom meeting ID looks like a placeholder. Please provide a real meeting link.";

        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meetingLink"],
          message
        });
      }
    }
  }
});
