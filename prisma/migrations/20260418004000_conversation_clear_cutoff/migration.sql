ALTER TABLE "Conversation"
ADD COLUMN IF NOT EXISTS "participantOneClearedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "participantTwoClearedAt" TIMESTAMP(3);
