"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  createBookingForPost,
  transitionBookingStatus,
  updatePendingBookingByRequester,
  type BookingTransitionAction
} from "@/lib/bookings/booking-service";
import { guardBookingInput } from "@/lib/security/input-guard";
import type { FormState } from "@/lib/types/form-state";
import { createBookingSchema } from "@/lib/validations/booking";

function mapCreateBookingErrorToMessage(error: string): string {
  switch (error) {
    case "POST_NOT_FOUND":
      return "This post no longer exists.";
    case "POST_NOT_OPEN":
      return "This post is closed for new booking requests.";
    case "ACTIVE_BOOKING_EXISTS":
      return "You already have an active request for this post.";
    case "INVALID_SESSION_MODE":
      return "This post does not allow that session mode.";
    case "OWN_POST_NOT_ALLOWED":
      return "You cannot book your own post.";
    default:
      return "Could not send booking request. Please try again.";
  }
}

function mapUpdateBookingErrorToMessage(error: string): string {
  switch (error) {
    case "BOOKING_NOT_FOUND":
      return "This booking was not found.";
    case "NOT_ALLOWED":
      return "You can edit only your own booking requests.";
    case "INVALID_STATUS":
      return "Only pending requests can be edited.";
    case "INVALID_SESSION_MODE":
      return "This post does not allow that session mode.";
    default:
      return "Could not update booking request. Please try again.";
  }
}

function mapTransitionErrorToMessage(error: string): string {
  switch (error) {
    case "BOOKING_NOT_FOUND":
      return "This booking was not found.";
    case "NOT_ALLOWED":
      return "You are not allowed to perform this action.";
    case "INVALID_STATUS":
      return "This action is not valid for the current booking status.";
    case "CONFLICT":
      return "This booking changed recently. Please refresh and try again.";
    default:
      return "Could not update booking status.";
  }
}

export async function createBookingAction(
  postId: string,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to request a session."
    };
  }

  const parsedData = createBookingSchema.safeParse({
    message: formData.get("message"),
    proposedDate: formData.get("proposedDate"),
    durationMinutes: formData.get("durationMinutes"),
    sessionMode: formData.get("sessionMode"),
    meetingLocation: formData.get("meetingLocation"),
    meetingLink: formData.get("meetingLink")
  });

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please review your booking request and try again.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  const guardResult = await guardBookingInput({
    message: parsedData.data.message,
    sessionMode: parsedData.data.sessionMode,
    meetingLocation: parsedData.data.meetingLocation,
    meetingLink: parsedData.data.meetingLink
  });

  if (!guardResult.ok) {
    return {
      status: "error",
      message: guardResult.message,
      fieldErrors: guardResult.fieldErrors
    };
  }

  const created = await createBookingForPost(postId, session.user.id, parsedData.data);

  if (!created.ok) {
    return {
      status: "error",
      message: mapCreateBookingErrorToMessage(created.error)
    };
  }

  return {
    status: "success",
    message: "Booking request sent."
  };
}

export async function updatePendingBookingAction(
  bookingId: string,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to edit booking requests."
    };
  }

  const parsedData = createBookingSchema.safeParse({
    message: formData.get("message"),
    proposedDate: formData.get("proposedDate"),
    durationMinutes: formData.get("durationMinutes"),
    sessionMode: formData.get("sessionMode"),
    meetingLocation: formData.get("meetingLocation"),
    meetingLink: formData.get("meetingLink")
  });

  if (!parsedData.success) {
    return {
      status: "error",
      message: "Please review your booking details and try again.",
      fieldErrors: parsedData.error.flatten().fieldErrors
    };
  }

  const guardResult = await guardBookingInput({
    message: parsedData.data.message,
    sessionMode: parsedData.data.sessionMode,
    meetingLocation: parsedData.data.meetingLocation,
    meetingLink: parsedData.data.meetingLink
  });

  if (!guardResult.ok) {
    return {
      status: "error",
      message: guardResult.message,
      fieldErrors: guardResult.fieldErrors
    };
  }

  const updated = await updatePendingBookingByRequester(
    bookingId,
    session.user.id,
    parsedData.data
  );

  if (!updated.ok) {
    return {
      status: "error",
      message: mapUpdateBookingErrorToMessage(updated.error)
    };
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}/edit`);
  redirect("/bookings?success=Booking%20request%20updated.");
}

async function performTransition(
  bookingId: string,
  action: BookingTransitionAction,
  redirectTo?: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const transitioned = await transitionBookingStatus(bookingId, session.user.id, action);

  if (!transitioned.ok) {
    const fallbackTarget = redirectTo ?? "/bookings";
    const encodedMessage = encodeURIComponent(mapTransitionErrorToMessage(transitioned.error));
    redirect(`${fallbackTarget}?error=${encodedMessage}`);
  }

  redirect(redirectTo ?? "/bookings");
}

export async function acceptBookingAction(bookingId: string, redirectTo?: string): Promise<void> {
  await performTransition(bookingId, "accept", redirectTo);
}

export async function rejectBookingAction(bookingId: string, redirectTo?: string): Promise<void> {
  await performTransition(bookingId, "reject", redirectTo);
}

export async function cancelBookingAction(bookingId: string, redirectTo?: string): Promise<void> {
  await performTransition(bookingId, "cancel", redirectTo);
}

export async function completeBookingAction(bookingId: string, redirectTo?: string): Promise<void> {
  await performTransition(bookingId, "complete", redirectTo);
}
