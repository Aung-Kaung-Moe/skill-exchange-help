"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import type { FormState } from "@/lib/types/form-state";
import {
  createSkillPost,
  deleteSkillPostByOwner,
  updateSkillPostByOwner
} from "@/lib/posts/post-service";
import { guardPostInput } from "@/lib/security/input-guard";
import { skillPostSchema } from "@/lib/validations/post";

function parseSkillPostForm(formData: FormData) {
  return skillPostSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    skillName: formData.get("skillName"),
    preferredMode: formData.get("preferredMode"),
    status: formData.get("status")
  });
}

export async function createSkillPostAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to create a post."
    };
  }

  const parsedData = parseSkillPostForm(formData);

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please review your post details and try again.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  const guardResult = await guardPostInput({
    title: parsedData.data.title,
    skillName: parsedData.data.skillName,
    description: parsedData.data.description
  });

  if (!guardResult.ok) {
    return {
      status: "error",
      message: guardResult.message,
      fieldErrors: guardResult.fieldErrors
    };
  }

  const createdPost = await createSkillPost(session.user.id, parsedData.data);
  redirect(`/posts/${createdPost.id}`);
}

export async function updateSkillPostAction(
  postId: string,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to edit this post."
    };
  }

  const parsedData = parseSkillPostForm(formData);

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please review your post details and try again.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  const guardResult = await guardPostInput({
    title: parsedData.data.title,
    skillName: parsedData.data.skillName,
    description: parsedData.data.description
  });

  if (!guardResult.ok) {
    return {
      status: "error",
      message: guardResult.message,
      fieldErrors: guardResult.fieldErrors
    };
  }

  const updated = await updateSkillPostByOwner(postId, session.user.id, parsedData.data);

  if (!updated) {
    return {
      status: "error",
      message: "You can only edit your own posts."
    };
  }

  redirect(`/posts/${postId}`);
}

export async function deleteSkillPostAction(postId: string): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const deleted = await deleteSkillPostByOwner(postId, session.user.id);

  if (!deleted) {
    redirect(`/posts/${postId}`);
  }

  redirect("/posts");
}
