CREATE TYPE "PreferredSessionMode" AS ENUM ('online', 'in_person', 'both');

ALTER TABLE "StudentProfile"
  DROP COLUMN "headline",
  DROP COLUMN "graduationYear",
  DROP COLUMN "skillsOffered",
  DROP COLUMN "skillsWanted",
  ADD COLUMN "username" TEXT,
  ADD COLUMN "year" INTEGER,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "preferredSessionMode" "PreferredSessionMode",
  ADD COLUMN "avatarUrl" TEXT;

UPDATE "StudentProfile"
SET "username" = CONCAT('student_', LEFT("userId", 8))
WHERE "username" IS NULL;

UPDATE "StudentProfile"
SET "year" = 1
WHERE "year" IS NULL;

UPDATE "StudentProfile"
SET "bio" = ''
WHERE "bio" IS NULL;

UPDATE "StudentProfile"
SET "location" = 'Not set'
WHERE "location" IS NULL;

UPDATE "StudentProfile"
SET "preferredSessionMode" = 'both'::"PreferredSessionMode"
WHERE "preferredSessionMode" IS NULL;

ALTER TABLE "StudentProfile"
  ALTER COLUMN "username" SET NOT NULL,
  ALTER COLUMN "year" SET NOT NULL,
  ALTER COLUMN "bio" SET NOT NULL,
  ALTER COLUMN "location" SET NOT NULL,
  ALTER COLUMN "preferredSessionMode" SET NOT NULL;

CREATE UNIQUE INDEX "StudentProfile_username_key" ON "StudentProfile"("username");
CREATE INDEX "StudentProfile_username_idx" ON "StudentProfile"("username");