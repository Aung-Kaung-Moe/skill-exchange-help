import { prisma } from "@/lib/db";
import type { PostStatus, PostType, PreferredSessionMode, Prisma } from "@prisma/client";
import type { SkillPostFilterInput } from "@/lib/validations/post";

export type UpsertSkillPostInput = {
  type: PostType;
  title: string;
  description: string;
  skillName: string;
  preferredMode: PreferredSessionMode;
  status: PostStatus;
};

const postSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  description: true,
  skillName: true,
  preferredMode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      studentProfile: {
        select: {
          username: true
        }
      }
    }
  }
} as const;

export async function listSkillPosts(filters?: SkillPostFilterInput) {
  const where: Prisma.SkillPostWhereInput = {
    bookings: {
      none: {
        status: "completed"
      }
    }
  };

  if (filters?.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { skillName: { contains: filters.q, mode: "insensitive" } }
    ];
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.preferredMode) {
    where.preferredMode = filters.preferredMode;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.university) {
    where.user = {
      is: {
        studentProfile: {
          is: {
            university: {
              contains: filters.university,
              mode: "insensitive"
            }
          }
        }
      }
    };
  }

  const orderBy: Prisma.SkillPostOrderByWithRelationInput =
    filters?.sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  return prisma.skillPost.findMany({
    where,
    orderBy: [orderBy],
    select: postSelect
  });
}

export async function listPostUniversities() {
  const profiles = await prisma.studentProfile.findMany({
    where: {
      user: {
        skillPosts: {
          some: {
            bookings: {
              none: {
                status: "completed"
              }
            }
          }
        }
      }
    },
    select: {
      university: true
    },
    distinct: ["university"],
    orderBy: {
      university: "asc"
    }
  });

  return profiles
    .map((profile) => profile.university.trim())
    .filter((university) => university.length > 0);
}

export async function getSkillPostById(id: string) {
  return prisma.skillPost.findUnique({
    where: { id },
    select: postSelect
  });
}

export async function createSkillPost(userId: string, input: UpsertSkillPostInput) {
  return prisma.skillPost.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      skillName: input.skillName,
      preferredMode: input.preferredMode,
      status: input.status
    },
    select: {
      id: true
    }
  });
}

export async function updateSkillPostByOwner(
  id: string,
  userId: string,
  input: UpsertSkillPostInput
) {
  const result = await prisma.skillPost.updateMany({
    where: {
      id,
      userId
    },
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      skillName: input.skillName,
      preferredMode: input.preferredMode,
      status: input.status
    }
  });

  return result.count > 0;
}

export async function deleteSkillPostByOwner(id: string, userId: string) {
  const result = await prisma.skillPost.deleteMany({
    where: {
      id,
      userId
    }
  });

  return result.count > 0;
}
