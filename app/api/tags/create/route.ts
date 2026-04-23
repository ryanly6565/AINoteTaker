import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    const cookieData = await cookies()
    const session = await getIronSession<SessionData>(
      cookieData,
      sessionOptions
    );

    const ownerId = session.userId;

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newTag = await prisma.tag.create({
      data: {
        name,
        ownerId
      },
    });

    return NextResponse.json(newTag, { status: 201 });

  } catch (error: any) {
    console.error("Error creating tag:", error);

    return NextResponse.json(
      { error: "Failed to create tag", details: error.message },
      { status: 500 }
    );
  }
}