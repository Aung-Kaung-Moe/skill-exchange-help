CREATE TYPE "PostType" AS ENUM ('offer', 'request');
CREATE TYPE "PostStatus" AS ENUM ('open', 'closed');

CREATE TABLE "SkillPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PostType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "preferredMode" "PreferredSessionMode" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SkillPost_userId_idx" ON "SkillPost"("userId");
CREATE INDEX "SkillPost_type_idx" ON "SkillPost"("type");
CREATE INDEX "SkillPost_status_idx" ON "SkillPost"("status");
CREATE INDEX "SkillPost_createdAt_idx" ON "SkillPost"("createdAt");

ALTER TABLE "SkillPost" ADD CONSTRAINT "SkillPost_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;