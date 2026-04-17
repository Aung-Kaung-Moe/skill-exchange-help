import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getUnreadMessageCountForUser } from "@/lib/chat/chat-service";
import { ActivityMenu } from "@/components/layout/activity-menu";
import { AccountMenu } from "@/components/layout/account-menu";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const unreadMessageCount = session?.user?.id
    ? await getUnreadMessageCountForUser(session.user.id)
    : 0;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          SkillBridge
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/posts" className="font-medium text-slate-700 hover:text-slate-900">
            Posts
          </Link>
          {session ? (
            <>
              <Link href="/posts/new" className="font-medium text-slate-700 hover:text-slate-900">
                New Post
              </Link>
              <ActivityMenu initialUnreadMessageCount={unreadMessageCount} />
              <NotificationBell userId={session.user.id} />
              <AccountMenu userName={session.user?.name} />
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-slate-700 hover:text-slate-900">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sky-700 px-3 py-1.5 font-medium text-white hover:bg-sky-800"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
