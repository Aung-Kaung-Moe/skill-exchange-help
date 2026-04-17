"use server";

import { redirect } from "next/navigation";
import { EmailAlreadyExistsError, registerStudent } from "@/lib/auth/auth-service";
import type { FormState } from "@/lib/types/form-state";
import { registerSchema } from "@/lib/validations/auth";

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsedData = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  try {
    await registerStudent({
      fullName: parsedData.data.fullName,
      email: parsedData.data.email,
      password: parsedData.data.password
    });
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
      return {
        status: "error",
        message: "An account with this email already exists."
      };
    }

    return {
      status: "error",
      message: "Registration failed. Please try again."
    };
  }

  redirect("/login?registered=1");
}

// Backward-compatible export for older component imports.
export const signUpAction = registerAction;
