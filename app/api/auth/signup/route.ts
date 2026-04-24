import { PrismaClient, User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    // Verify username, email, and password are provided
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
        return NextResponse.json(
            { message: "Username, email, and password are all required." },
            { status: 400 }
        );
    }

    // Verify all are of string type
    if (typeof username !== "string") {
        return NextResponse.json(
            { message: "Username must be a string." },
            { status: 400 }
        );
    } else if (typeof email !== "string") {
        return NextResponse.json(
            { message: "Email must be a string." },
            { status: 400 }
        );
    } else if (typeof password !== "string") {
        return NextResponse.json(
            { message: "Password must be a string." },
            { status: 400 }
        );
    }

    try {
        // Check if username/email are already taken
        const existingUser: User | null = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: username.toLowerCase() },
                    { email: email.toLowerCase() }
                ]
            },
        });

        if (existingUser) {
            const message =
                existingUser.name === username.toLowerCase()
                    ? "Username already taken"
                    : "Email already taken";

            return NextResponse.json({ message }, { status: 400 });
        }

        // Hash password and create new user
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: username.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword
            }
        });

        
        await prisma.tag.create({
        data: {
            name: "Garbage",
            ownerId: newUser.id,
            userTagId: -1
        },
        });

        return NextResponse.json(
            { message: "Account successfully created" },
            { status: 200 }
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { message: "Sorry, something went wrong." },
            { status: 500 }
        );
    }
}