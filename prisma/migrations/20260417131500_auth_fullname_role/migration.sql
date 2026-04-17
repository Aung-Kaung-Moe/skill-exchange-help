ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";

UPDATE "User"
SET "fullName" = 'Student'
WHERE "fullName" IS NULL OR btrim("fullName") = '';

ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student';