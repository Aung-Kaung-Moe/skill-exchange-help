import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { SkillPostForm, type SkillPostFormValues } from "@/components/posts/post-form";
import { authOptions } from "@/lib/auth/auth-options";
import { getSkillPostById } from "@/lib/posts/post-service";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const post = await getSkillPostById(id);

  if (!post) {
    notFound();
  }

  if (post.userId !== session.user.id) {
    redirect(`/posts/${post.id}`);
  }

  const initialValues: SkillPostFormValues = {
    type: post.type,
    title: post.title,
    description: post.description,
    skillName: post.skillName,
    preferredMode: post.preferredMode,
    status: post.status
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Skill Post</h1>
        <p className="text-sm text-slate-600">Update details for your post.</p>
      </div>

      <SkillPostForm mode="edit" initialValues={initialValues} postId={post.id} />

      <Link href={`/posts/${post.id}`} className="inline-block text-sm font-medium">
        Back to post
      </Link>
    </section>
  );
}
