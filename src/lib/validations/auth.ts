import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string({
        required_error: "Full name is required."
      })
      .trim()
      .min(1, "Full name is required.")
      .max(80, "Full name must be at most 80 characters."),
    email: z
      .string({
        required_error: "Email is required."
      })
      .trim()
      .email("Please enter a valid email address."),
    password: z
      .string({
        required_error: "Password is required."
      })
      .min(1, "Password is required.")
      .max(128, "Password must be at most 128 characters."),
    confirmPassword: z
      .string({
        required_error: "Please confirm your password."
      })
      .min(1, "Please confirm your password.")
      .max(128, "Password confirmation must be at most 128 characters.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required."
    })
    .trim()
    .email("Please enter a valid email address."),
  password: z
    .string({
      required_error: "Password is required."
    })
    .min(1, "Password is required.")
    .max(128, "Password must be at most 128 characters.")
});

// Backward-compatible exports for existing imports while migrating routes/components.
export const signUpSchema = registerSchema;
export const signInSchema = loginSchema;
