import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { tagId, name } = await request.json();

    const cookieData = await cookies()
    const session = await getIronSession<SessionData>(
      cookieData,
      sessionOptions
    );

    const ownerId = session.userId;

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedTag = await prisma.tag.update({
      where: {
        id: Number(tagId),
        ownerId: ownerId
      },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedTag, { status: 200 });

  } catch (error: any) {
    console.error("Error updating tag:", error);

    return NextResponse.json(
      { error: "Failed to update tag", details: error.message },
      { status: 500 }
    );
  }
}