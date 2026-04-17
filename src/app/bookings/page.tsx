import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  acceptBookingAction,
  cancelBookingAction,
  completeBookingAction,
  rejectBookingAction
} from "@/lib/actions/booking-actions";
import { authOptions } from "@/lib/auth/auth-options";
import {
  listIncomingBookingsForUser,
  listOutgoingBookingsForUser
} from "@/lib/bookings/booking-service";

type BookingsPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

function formatStatus(status: "pending" | "accepted" | "rejected" | "cancelled" | "completed") {
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  return "Completed";
}

function statusBadgeClass(status: "pending" | "accepted" | "rejected" | "cancelled" | "completed") {
  if (status === "accepted") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-indigo-100 text-indigo-700";
}

function formatDate(date: Date) {
  return date.toLocaleString();
}

function formatSessionMode(mode: "online" | "in_person" | "both") {
  if (mode === "online") return "Online";
  if (mode === "in_person") return "In person";
  return "Both";
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [incoming, outgoing] = await Promise.all([
    listIncomingBookingsForUser(session.user.id),
    listOutgoingBookingsForUser(session.user.id)
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Bookings</h1>
        <p className="text-sm text-slate-600">
          Track incoming requests for your posts and outgoing requests you created.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {params.error}
        </p>
      ) : null}

      {params.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Incoming Requests</h2>
        {incoming.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            No incoming requests yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {incoming.map((booking) => (
              <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      <Link href={`/posts/${booking.post.id}`} className="hover:underline">
                        {booking.post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600">
                      Requester: {booking.requester.fullName}
                      {booking.requester.studentProfile?.username
                        ? ` (@${booking.requester.studentProfile.username})`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(booking.status)}`}
                  >
                    {formatStatus(booking.status)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">{booking.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Mode: {formatSessionMode(booking.sessionMode)} | Proposed: {formatDate(booking.proposedDate)} |
                  {" "}Duration: {booking.durationMinutes} min
                </p>
                {booking.sessionMode === "in_person" && booking.meetingLocation ? (
                  <p className="mt-1 text-xs text-slate-500">Meet at: {booking.meetingLocation}</p>
                ) : null}
                {booking.sessionMode === "online" && booking.meetingLink ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Zoom:{" "}
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sky-700 hover:text-sky-800"
                    >
                      {booking.meetingLink}
                    </a>
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {booking.status === "pending" ? (
                    <>
                      <form action={acceptBookingAction.bind(null, booking.id, "/bookings")}>
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                      </form>
                      <form action={rejectBookingAction.bind(null, booking.id, "/bookings")}>
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </form>
                    </>
                  ) : null}

                  {booking.status === "accepted" ? (
                    <>
                      <Link
                        href={`/messages?bookingId=${booking.id}`}
                        className="rounded-md border border-sky-300 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Open Chat
                      </Link>
                      <form action={completeBookingAction.bind(null, booking.id, "/bookings")}>
                        <button
                          type="submit"
                          className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          Mark Completed
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            No outgoing requests yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {outgoing.map((booking) => (
              <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      <Link href={`/posts/${booking.post.id}`} className="hover:underline">
                        {booking.post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600">
                      Provider: {booking.provider.fullName}
                      {booking.provider.studentProfile?.username
                        ? ` (@${booking.provider.studentProfile.username})`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(booking.status)}`}
                  >
                    {formatStatus(booking.status)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">{booking.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Mode: {formatSessionMode(booking.sessionMode)} | Proposed: {formatDate(booking.proposedDate)} |
                  {" "}Duration: {booking.durationMinutes} min
                </p>
                {booking.sessionMode === "in_person" && booking.meetingLocation ? (
                  <p className="mt-1 text-xs text-slate-500">Meet at: {booking.meetingLocation}</p>
                ) : null}
                {booking.sessionMode === "online" && booking.meetingLink ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Zoom:{" "}
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sky-700 hover:text-sky-800"
                    >
                      {booking.meetingLink}
                    </a>
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {booking.status === "pending" ? (
                    <>
                      <Link
                        href={`/bookings/${booking.id}/edit`}
                        className="rounded-md border border-sky-300 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Edit Request
                      </Link>
                      <form action={cancelBookingAction.bind(null, booking.id, "/bookings")}>
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </form>
                    </>
                  ) : null}

                  {booking.status === "accepted" ? (
                    <>
                      <Link
                        href={`/messages?bookingId=${booking.id}`}
                        className="rounded-md border border-sky-300 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Open Chat
                      </Link>
                      <form action={completeBookingAction.bind(null, booking.id, "/bookings")}>
                        <button
                          type="submit"
                          className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          Mark Completed
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
