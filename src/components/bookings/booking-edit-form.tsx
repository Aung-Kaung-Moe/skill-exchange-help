"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { updatePendingBookingAction } from "@/lib/actions/booking-actions";
import { initialFormState } from "@/lib/types/form-state";

type BookingEditFormProps = {
  bookingId: string;
  preferredMode: "online" | "in_person" | "both";
  initialValues: {
    message: string;
    sessionMode: "online" | "in_person";
    meetingLocation: string;
    meetingLink: string;
    proposedDateIso: string;
    durationMinutes: number;
  };
};

function toDateTimeLocalInputValue(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function BookingEditForm({ bookingId, preferredMode, initialValues }: BookingEditFormProps) {
  const formActionWithBooking = updatePendingBookingAction.bind(null, bookingId);
  const [state, formAction, pending] = useActionState(formActionWithBooking, initialFormState);
  const resolvedMode = useMemo(
    () => (preferredMode === "both" ? "both" : preferredMode),
    [preferredMode]
  );
  const initialSessionMode = useMemo(
    () => (resolvedMode === "both" ? initialValues.sessionMode : resolvedMode),
    [initialValues.sessionMode, resolvedMode]
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
          defaultValue={initialValues.message}
          placeholder="Describe what you want to learn."
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
              defaultValue={initialValues.meetingLocation}
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
              defaultValue={initialValues.meetingLink}
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
            defaultValue={toDateTimeLocalInputValue(initialValues.proposedDateIso)}
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
            defaultValue={initialValues.durationMinutes}
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
          <p>{state.message ?? "Could not update booking request."}</p>
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        <Link
          href="/bookings"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Back to Bookings
        </Link>
      </div>
    </form>
  );
}
