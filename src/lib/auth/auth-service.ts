import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type RegisterStudentInput = {
  fullName: string;
  email: string;
  password: string;
};

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerStudent(input: RegisterStudentInput): Promise<void> {
  const email = normalizeEmail(input.email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    throw new EmailAlreadyExistsError();
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      passwordHash,
      role: "student"
    }
  });
}

export async function validateUserCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      passwordHash: true
    }
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  };
}
