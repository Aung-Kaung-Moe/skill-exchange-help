import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookingRequestForm } from "@/components/bookings/booking-request-form";
import { authOptions } from "@/lib/auth/auth-options";
import { getActiveBookingForRequester } from "@/lib/bookings/booking-service";
import { deleteSkillPostAction } from "@/lib/actions/post-actions";
import { getSkillPostById } from "@/lib/posts/post-service";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatMode(mode: "online" | "in_person" | "both") {
  if (mode === "online") return "Online";
  if (mode === "in_person") return "In person";
  return "Both";
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const [session, post] = await Promise.all([getServerSession(authOptions), getSkillPostById(id)]);

  if (!post) {
    notFound();
  }

  const isOwner = session?.user?.id === post.userId;
  const activeBooking =
    session?.user?.id && !isOwner
      ? await getActiveBookingForRequester(post.id, session.user.id)
      : null;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold uppercase text-sky-700">
              {post.type}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
              {post.status}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              {formatMode(post.preferredMode)}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="text-sm text-slate-600">
            Skill: <span className="font-medium text-slate-800">{post.skillName}</span>
          </p>
          <p className="text-sm text-slate-600">
            By {post.user.fullName}
            {post.user.studentProfile?.username ? ` (@${post.user.studentProfile.username})` : ""}
          </p>
          <Link href={`/students/${post.userId}`} className="text-sm font-medium">
            View student profile
          </Link>
        </div>

        {isOwner ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
            <form action={deleteSkillPostAction.bind(null, post.id)}>
              <button
                type="submit"
                className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <article className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
        {post.description}
      </article>

      <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Request a Session</h2>

        {!session ? (
          <p className="text-sm text-slate-600">
            <Link href="/login" className="font-medium">
              Sign in
            </Link>{" "}
            to request a session for this post.
          </p>
        ) : isOwner ? (
          <p className="text-sm text-slate-600">You cannot request a session on your own post.</p>
        ) : post.status !== "open" ? (
          <p className="text-sm text-slate-600">This post is closed and not accepting booking requests.</p>
        ) : activeBooking ? (
          <p className="text-sm text-slate-600">
            You already have an active request for this post. Continue from{" "}
            <Link href="/bookings" className="font-medium">
              My Bookings
            </Link>.
          </p>
        ) : (
          <BookingRequestForm postId={post.id} preferredMode={post.preferredMode} />
        )}
      </section>
    </section>
  );
}
