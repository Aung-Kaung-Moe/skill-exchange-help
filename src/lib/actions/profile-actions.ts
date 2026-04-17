"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { upsertOwnStudentProfile } from "@/lib/profile/profile-service";
import type { FormState } from "@/lib/types/form-state";
import { studentProfileSchema } from "@/lib/validations/profile";

export async function saveProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to update your profile."
    };
  }

  const parsedData = studentProfileSchema.safeParse({
    username: formData.get("username"),
    university: formData.get("university"),
    major: formData.get("major"),
    year: formData.get("year"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    preferredSessionMode: formData.get("preferredSessionMode"),
    avatarUrl: formData.get("avatarUrl")
  });

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please review your profile details and try again.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  const baseUsername = parsedData.data.username.trim().toLowerCase();
  const normalizedUsername =
    baseUsername.length > 0 ? baseUsername : `student_${session.user.id.slice(0, 8)}`;

  try {
    await upsertOwnStudentProfile(session.user.id, {
      username: normalizedUsername,
      university: parsedData.data.university,
      major: parsedData.data.major,
      year: parsedData.data.year,
      bio: parsedData.data.bio,
      location: parsedData.data.location,
      preferredSessionMode: parsedData.data.preferredSessionMode,
      avatarUrl: parsedData.data.avatarUrl ?? null
    });
  } catch (error) {
    const isUniqueUsernameError =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (Array.isArray(error.meta?.target)
        ? error.meta.target.includes("username")
        : String(error.meta?.target).includes("username"));

    if (isUniqueUsernameError) {
      const fallbackUsername = `student_${session.user.id.slice(0, 6)}_${Date.now().toString().slice(-4)}`;
      try {
        await upsertOwnStudentProfile(session.user.id, {
          username: fallbackUsername,
          university: parsedData.data.university,
          major: parsedData.data.major,
          year: parsedData.data.year,
          bio: parsedData.data.bio,
          location: parsedData.data.location,
          preferredSessionMode: parsedData.data.preferredSessionMode,
          avatarUrl: parsedData.data.avatarUrl ?? null
        });

        return {
          status: "success",
          message: `Profile saved. Username auto-set to ${fallbackUsername}.`
        };
      } catch {
        return {
          status: "error",
          message: "Could not save your profile right now. Please try again."
        };
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        status: "error",
        message: "Your account was not found. Please sign in again."
      };
    }

    return {
      status: "error",
      message: "Could not save your profile right now. Please try again."
    };
  }

  return {
    status: "success",
    message: "Profile saved successfully."
  };
}
