import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validatePassword } from "~/lib/password-validation";
import { connectDB } from "~/server/db";
import { UserModel } from "~/server/models";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
