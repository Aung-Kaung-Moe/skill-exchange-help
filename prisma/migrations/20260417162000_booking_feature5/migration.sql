CREATE TYPE "BookingStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed');

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Booking_requester_provider_diff" CHECK ("requesterId" <> "providerId")
);

CREATE INDEX "Booking_postId_idx" ON "Booking"("postId");
CREATE INDEX "Booking_requesterId_idx" ON "Booking"("requesterId");
CREATE INDEX "Booking_providerId_idx" ON "Booking"("providerId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_proposedDate_idx" ON "Booking"("proposedDate");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "SkillPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;