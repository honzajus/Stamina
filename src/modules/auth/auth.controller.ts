import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { signAuthToken } from "../../lib/jwt";
import { serializeUser } from "../../lib/serializers";
import { ApiError } from "../../lib/errors";
import { LoginInput, RegisterInput } from "./auth.schemas";

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { email, password, name, sports } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, sports: JSON.stringify(sports) },
  });

  const token = signAuthToken({ userId: user.id });
  res.status(201).json({ token, user: serializeUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signAuthToken({ userId: user.id });
  res.json({ token, user: serializeUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({ user: serializeUser(user) });
}
