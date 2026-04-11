import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePassword } from "~/lib/password-validation";
import { connectDB } from "~/server/db";
import { UserModel, ContentFlagModel, BannedEmailModel } from "~/server/models";
import { censorText } from "~/server/lib/censor";
import { BCRYPT_ROUNDS } from "~/server/constants";
import { rateLimit, getClientIp } from "~/server/rate-limit";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "register" });

const registerSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().trim(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const { ok } = await rateLimit(
      `rl:register:${getClientIp(request)}`,
      5,
      900,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }
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

    const [existingUser, bannedEmail] = await Promise.all([
      UserModel.findOne({ email: email.toLowerCase() }).lean(),
      BannedEmailModel.findOne({ email: email.toLowerCase() }).lean(),
    ]);

    if (bannedEmail) {
      return NextResponse.json(
        { error: "Unable to create account" },
        { status: 403 },
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const nameCensored = censorText(name.trim());

    const user = await UserModel.create({
      name: nameCensored.cleaned,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      username: email.toLowerCase().trim().split("@")[0],
      registrationIp: getClientIp(request),
    });

    if (nameCensored.flagged) {
      await ContentFlagModel.create({
        contentType: "registration",
        contentId: user._id,
        userId: user._id,
        originalText: name.trim(),
        censoredText: nameCensored.cleaned,
        flaggedWords: nameCensored.flaggedWords,
      });
    }

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
