import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookingEditForm } from "@/components/bookings/booking-edit-form";
import { authOptions } from "@/lib/auth/auth-options";
import { getPendingOutgoingBookingForRequester } from "@/lib/bookings/booking-service";

type EditBookingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBookingPage({ params }: EditBookingPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const booking = await getPendingOutgoingBookingForRequester(id, session.user.id);

  if (!booking) {
    notFound();
  }

  if (booking.status !== "pending") {
    redirect("/bookings?error=Only%20pending%20requests%20can%20be%20edited.");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Booking Request</h1>
        <p className="text-sm text-slate-600">
          Update your pending request before the provider accepts it.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Post: <span className="font-medium text-slate-900">{booking.post.title}</span>
        </p>
      </div>

      <BookingEditForm
        bookingId={booking.id}
        preferredMode={booking.post.preferredMode}
        initialValues={{
          message: booking.message,
          sessionMode: booking.sessionMode === "in_person" ? "in_person" : "online",
          meetingLocation: booking.meetingLocation ?? "",
          meetingLink: booking.meetingLink ?? "",
          proposedDateIso: booking.proposedDate.toISOString(),
          durationMinutes: booking.durationMinutes
        }}
      />
    </section>
  );
}
