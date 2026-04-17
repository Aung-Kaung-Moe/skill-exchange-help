"use client";

import { useActionState, useMemo, useState } from "react";
import { createBookingAction } from "@/lib/actions/booking-actions";
import { initialFormState } from "@/lib/types/form-state";

type BookingRequestFormProps = {
  postId: string;
  preferredMode: "online" | "in_person" | "both";
};

function getDefaultDateTimeLocal(): string {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const year = nextHour.getFullYear();
  const month = String(nextHour.getMonth() + 1).padStart(2, "0");
  const day = String(nextHour.getDate()).padStart(2, "0");
  const hours = String(nextHour.getHours()).padStart(2, "0");
  const minutes = String(nextHour.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function BookingRequestForm({ postId, preferredMode }: BookingRequestFormProps) {
  const formActionWithPost = createBookingAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(formActionWithPost, initialFormState);
  const resolvedMode = useMemo(
    () => (preferredMode === "both" ? "both" : preferredMode),
    [preferredMode]
  );
  const initialSessionMode = useMemo(
    () => (resolvedMode === "both" ? "online" : resolvedMode),
    [resolvedMode]
  );
  const [sessionMode, setSessionMode] = useState<"online" | "in_person">(initialSessionMode);
  const fieldErrors = state.fieldErrors ?? {};
  const messageError = fieldErrors.message?.[0];
  const meetingLocationError = fieldErrors.meetingLocation?.[0];
  const meetingLinkError = fieldErrors.meetingLink?.[0];
  const proposedDateError = fieldErrors.proposedDate?.[0];
  const durationMinutesError = fieldErrors.durationMinutes?.[0];
  const allFieldWarnings = Object.values(fieldErrors).flatMap((messages) => messages ?? []);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="message" className="text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Introduce yourself and describe what you want to learn."
          className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            messageError
              ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
              : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
          }`}
        />
        {messageError ? <p className="text-xs text-rose-700">{messageError}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {resolvedMode === "both" ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="sessionMode" className="text-sm font-medium text-slate-700">
              Session mode
            </label>
            <select
              id="sessionMode"
              name="sessionMode"
              value={sessionMode}
              onChange={(event) => setSessionMode(event.target.value as "online" | "in_person")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="sessionMode" value={resolvedMode} />
        )}

        {sessionMode === "in_person" ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="meetingLocation" className="text-sm font-medium text-slate-700">
              Meeting location
            </label>
            <input
              id="meetingLocation"
              name="meetingLocation"
              type="text"
              required
              placeholder="e.g. Campus library lobby"
              className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                meetingLocationError
                  ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                  : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
              }`}
            />
            {meetingLocationError ? (
              <p className="text-xs text-rose-700">{meetingLocationError}</p>
            ) : null}
          </div>
        ) : (
          <input type="hidden" name="meetingLocation" value="" />
        )}

        {sessionMode === "online" ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="meetingLink" className="text-sm font-medium text-slate-700">
              Zoom link
            </label>
            <input
              id="meetingLink"
              name="meetingLink"
              type="url"
              required
              placeholder="https://zoom.us/j/..."
              className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                meetingLinkError
                  ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                  : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
              }`}
            />
            {meetingLinkError ? <p className="text-xs text-rose-700">{meetingLinkError}</p> : null}
          </div>
        ) : (
          <input type="hidden" name="meetingLink" value="" />
        )}

        <div className="space-y-1">
          <label htmlFor="proposedDate" className="text-sm font-medium text-slate-700">
            Proposed date & time
          </label>
          <input
            id="proposedDate"
            name="proposedDate"
            type="datetime-local"
            required
            defaultValue={getDefaultDateTimeLocal()}
            className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              proposedDateError
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
            }`}
          />
          {proposedDateError ? <p className="text-xs text-rose-700">{proposedDateError}</p> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="durationMinutes" className="text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={15}
            step={15}
            required
            defaultValue={60}
            className={`w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              durationMinutesError
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-600"
                : "border-slate-300 focus:border-sky-600 focus:ring-sky-600"
            }`}
          />
          {durationMinutesError ? (
            <p className="text-xs text-rose-700">{durationMinutesError}</p>
          ) : null}
        </div>
      </div>

      {state.status === "error" ? (
        <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <p>{state.message ?? "Could not send booking request."}</p>
          {allFieldWarnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {allFieldWarnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
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
        {pending ? "Sending..." : "Request Session"}
      </button>
    </form>
  );
}
