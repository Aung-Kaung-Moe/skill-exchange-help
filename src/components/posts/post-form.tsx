"use client";

import { useActionState } from "react";
import {
  createSkillPostAction,
  updateSkillPostAction
} from "@/lib/actions/post-actions";
import { initialFormState } from "@/lib/types/form-state";

export type SkillPostFormValues = {
  type: "offer" | "request";
  title: string;
  description: string;
  skillName: string;
  preferredMode: "online" | "in_person" | "both";
  status: "open" | "closed";
};

type SkillPostFormProps = {
  mode: "create" | "edit";
  initialValues: SkillPostFormValues;
  postId?: string;
};

export function SkillPostForm({ mode, initialValues, postId }: SkillPostFormProps) {
  const action =
    mode === "edit" && postId
      ? updateSkillPostAction.bind(null, postId)
      : createSkillPostAction;

  const [state, formAction, pending] = useActionState(action, initialFormState);
  const fieldErrors = state.fieldErrors ?? {};
  const titleError = fieldErrors.title?.[0];
  const skillNameError = fieldErrors.skillName?.[0];
  const descriptionError = fieldErrors.description?.[0];
  const allFieldWarnings = Object.values(fieldErrors).flatMap((messages) => messages ?? []);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initialValues.type}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          >
            <option value="offer">Offer</option>
            <option value="request">Request</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues.status}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={initialValues.title}
            required
            className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              titleError
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
            }`}
          />
          {titleError ? <p className="text-xs text-rose-700">{titleError}</p> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="skillName" className="text-sm font-medium text-slate-700">
            Skill name
          </label>
          <input
            id="skillName"
            name="skillName"
            type="text"
            defaultValue={initialValues.skillName}
            required
            className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              skillNameError
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
            }`}
          />
          {skillNameError ? <p className="text-xs text-rose-700">{skillNameError}</p> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="preferredMode" className="text-sm font-medium text-slate-700">
            Preferred mode
          </label>
          <select
            id="preferredMode"
            name="preferredMode"
            defaultValue={initialValues.preferredMode}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
          >
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={initialValues.description}
            required
            className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              descriptionError
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
            }`}
          />
          {descriptionError ? <p className="text-xs text-rose-700">{descriptionError}</p> : null}
        </div>
      </div>

      {state.status === "error" ? (
        <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <p>{state.message ?? "Could not save this post."}</p>
          {allFieldWarnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {allFieldWarnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : mode === "create" ? "Create Post" : "Update Post"}
      </button>
    </form>
  );
}
