"use client";

import { useActionState } from "react";
import { saveProfileAction } from "@/lib/actions/profile-actions";
import { initialFormState } from "@/lib/types/form-state";

export type ProfileFormValues = {
  username: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  location: string;
  preferredSessionMode: "online" | "in_person" | "both";
  avatarUrl: string;
};

type ProfileFormProps = {
  initialValues: ProfileFormValues;
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfileAction, initialFormState);
  const firstFieldError = state.fieldErrors ? Object.values(state.fieldErrors)[0]?.[0] : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={initialValues.username}
            placeholder="e.g. msi_student"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="university" className="text-sm font-medium text-slate-700">
            University
          </label>
          <input
            id="university"
            name="university"
            type="text"
            defaultValue={initialValues.university}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="major" className="text-sm font-medium text-slate-700">
            Major
          </label>
          <input
            id="major"
            name="major"
            type="text"
            defaultValue={initialValues.major}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="year" className="text-sm font-medium text-slate-700">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={initialValues.year}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={initialValues.location}
            placeholder="e.g. Yangon"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="preferredSessionMode" className="text-sm font-medium text-slate-700">
            Preferred session mode
          </label>
          <select
            id="preferredSessionMode"
            name="preferredSessionMode"
            defaultValue={initialValues.preferredSessionMode}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          >
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium text-slate-700">
            Avatar URL (optional)
          </label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            defaultValue={initialValues.avatarUrl}
            placeholder="https://example.com/avatar.jpg"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="bio" className="text-sm font-medium text-slate-700">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={initialValues.bio}
            placeholder="Share what you study and the kind of collaboration you enjoy."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message ?? firstFieldError ?? "Could not save profile."}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
