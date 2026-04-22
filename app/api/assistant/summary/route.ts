import { NextResponse } from "next/server";
import { getAIService } from "@/services/ai/AIServiceFactory";
import {getIronSession} from "iron-session";
import {SessionData, sessionOptions} from "@/lib/lib";
import {cookies} from "next/headers";

export async function POST(req: Request) {
    // Verify user is logged in
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!req.headers.get("Content-Type")?.includes("multipart/form-data")) {
        return NextResponse.json({ message: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    try {
        // Get form data and check file is provided
        const formData = await req.formData();
        const file = formData.get("file");
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ message: "A file must be provided in the \'file\' field" }, { status: 400 })
        }

        // Check file type is an appropriate option
        const allowedTypes = new Set(["text/plain", "application/pdf", "image/png", "image/jpeg"]);
        if (!allowedTypes.has(file.type)) {
            return NextResponse.json(
                { message: `File must be one of the following types: ${Array.from(allowedTypes).join(", ")}` },
                { status: 400 }
            );
        }

        // Verify file size does not exceed 2MB (arbitrary limit, feel free to change)
        if (file.size > 2e6) {
            return NextResponse.json({ message: `File exceeds maximum file size` }, { status: 400 });
        }

        const aiService = getAIService();
        const result = await aiService.generateNotes(file);
        return NextResponse.json({ message: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Sorry, something went wrong." }, { status: 500 });
    }
    
}
