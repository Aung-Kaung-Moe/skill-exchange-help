ALTER TABLE "Booking"
  ADD COLUMN "sessionMode" "PreferredSessionMode",
  ADD COLUMN "meetingLocation" TEXT,
  ADD COLUMN "meetingLink" TEXT;

UPDATE "Booking" b
SET "sessionMode" = p."preferredMode"
FROM "SkillPost" p
WHERE b."postId" = p."id";

ALTER TABLE "Booking"
  ALTER COLUMN "sessionMode" SET NOT NULL;

CREATE INDEX "Booking_sessionMode_idx" ON "Booking"("sessionMode");