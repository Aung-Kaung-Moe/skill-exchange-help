"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type AccountMenuProps = {
  userName?: string | null;
};

export function AccountMenu({ userName }: AccountMenuProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
      >
        Account
      </button>

      <div className="invisible pointer-events-none absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <p className="px-3 py-2 text-xs font-medium text-slate-500">{userName ?? "Signed in"}</p>
        <Link
          href="/profile/me"
          className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          My Profile
        </Link>
        <Link
          href="/profile/edit"
          className="mt-1 block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Edit Profile
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
