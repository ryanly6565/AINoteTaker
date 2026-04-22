import { getIronSession } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { defaultSession, sessionOptions, SessionData } from '@/lib/lib'
import {PrismaClient, User} from "@prisma/client";
import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";

const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const prisma = new PrismaClient();
    
    // Verify all fields provided and of valid type
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
        return NextResponse.json({ message: "You must provide your username/email and password." }, { status: 400 })
    } else if (identifier && typeof identifier !== "string") {
        return NextResponse.json({ message: "Username must be a string." }, { status: 400 })
    } else if (password && typeof password !== "string") {
        return NextResponse.json({ message: "Password must be a string" }, { status: 400 })
    }

    // Check if user exists
    try {
        const user: User | null = await prisma.user.findFirst({
            where: {
                OR: [{ name: identifier }, { email: identifier }]
            }
        });

        // If no existing user found, return 400 error
        if (!user) {
            return NextResponse.json({ message: "Incorrect username, email, or password." }, { status: 400 })
        }

        // Verify password is correct
        if (!await bcrypt.compare(password, user.password)) {
            return NextResponse.json({ message: "Incorrect username, email, or password." }, { status: 400 })
        }

        // User logged in, create a session
        const cookieStore = await cookies();

        const session = await getIronSession<SessionData>(
            cookieStore,
            sessionOptions
        );
        session.isLoggedIn = true;
        session.username = user.name;
        session.userId = user.id;
        await session.save();

        return NextResponse.json({ userId: session.userId, username: session.username, isLoggedIn: true }, { status: 200 })

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: "Sorry, something went wrong." }, { status: 500 })
    }
}


