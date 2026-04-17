import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { parsePostListFilters } from "@/lib/posts/post-query";
import { listPostUniversities, listSkillPosts } from "@/lib/posts/post-service";

function formatMode(mode: "online" | "in_person" | "both") {
  if (mode === "online") return "Online";
  if (mode === "in_person") return "In person";
  return "Both";
}

type PostsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const filters = parsePostListFilters(params);

  const [session, posts, universities] = await Promise.all([
    getServerSession(authOptions),
    listSkillPosts(filters),
    listPostUniversities()
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Skill Posts</h1>
          <p className="text-sm text-slate-600">Browse student skill offers and requests.</p>
        </div>

        {session ? (
          <Link
            href="/posts/new"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            New Post
          </Link>
        ) : null}
      </div>

      <form method="get" className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <label htmlFor="q" className="text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={filters.q ?? ""}
              placeholder="Search title, description, or skill name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="type" className="text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={filters.type ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">All types</option>
              <option value="offer">Offer</option>
              <option value="request">Request</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="mode" className="text-sm font-medium text-slate-700">
              Preferred mode
            </label>
            <select
              id="mode"
              name="mode"
              defaultValue={filters.preferredMode ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">All modes</option>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="university" className="text-sm font-medium text-slate-700">
              University
            </label>
            <select
              id="university"
              name="university"
              defaultValue={filters.university ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">All universities</option>
              {universities.map((university) => (
                <option key={university} value={university}>
                  {university}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="sort" className="text-sm font-medium text-slate-700">
              Sort
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={filters.sort}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Apply
          </button>
          <Link
            href="/posts"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear
          </Link>
        </div>
      </form>

      <p className="text-sm text-slate-600">
        Showing {posts.length} post{posts.length === 1 ? "" : "s"}.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No posts match your current filters.
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
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

              <h2 className="text-lg font-semibold text-slate-900">
                <Link href={`/posts/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Skill: <span className="font-medium text-slate-800">{post.skillName}</span>
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-slate-700">{post.description}</p>

              <p className="mt-3 text-xs text-slate-500">
                By {post.user.fullName}
                {post.user.studentProfile?.username ? ` (@${post.user.studentProfile.username})` : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
