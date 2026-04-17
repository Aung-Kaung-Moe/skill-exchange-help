import { prisma } from "@/lib/db";
import type { PreferredSessionMode } from "@prisma/client";

export type UpsertStudentProfileInput = {
  username: string;
  university: string;
  major: string;
  year: number;
  bio: string;
  location: string;
  preferredSessionMode: PreferredSessionMode;
  avatarUrl?: string | null;
};

export async function getOwnStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      username: true,
      university: true,
      major: true,
      year: true,
      bio: true,
      location: true,
      preferredSessionMode: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });
}

export async function getPublicStudentProfileByUserId(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      userId: true,
      username: true,
      university: true,
      major: true,
      year: true,
      bio: true,
      location: true,
      preferredSessionMode: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          fullName: true
        }
      }
    }
  });
}

export async function upsertOwnStudentProfile(userId: string, input: UpsertStudentProfileInput) {
  return prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      username: input.username,
      university: input.university,
      major: input.major,
      year: input.year,
      bio: input.bio,
      location: input.location,
      preferredSessionMode: input.preferredSessionMode,
      avatarUrl: input.avatarUrl ?? null
    },
    update: {
      username: input.username,
      university: input.university,
      major: input.major,
      year: input.year,
      bio: input.bio,
      location: input.location,
      preferredSessionMode: input.preferredSessionMode,
      avatarUrl: input.avatarUrl ?? null
    }
  });
}
