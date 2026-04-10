import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePassword } from "~/lib/password-validation";
import { connectDB } from "~/server/db";
import { UserModel } from "~/server/models";
import { BCRYPT_ROUNDS } from "~/server/constants";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "register" });

const registerSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().trim(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid name, email, or password" },
        { status: 400 },
      );
    }
    const { name, email, password } = parsed.data;

    if (!validatePassword(password).isValid) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with one number and one special character",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      username: email.toLowerCase().trim().split("@")[0],
    });

    return NextResponse.json(
      { id: user._id.toString(), email: user.email },
      { status: 201 },
    );
  } catch (error) {
    log.error({ err: error }, "Registration error");
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
