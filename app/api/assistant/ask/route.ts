import { getAIService } from '@/services/ai/AIServiceFactory';
import { IAIService } from '@/services/ai/IAIService';
import {NextResponse} from "next/server";
import {getIronSession} from "iron-session";
import {SessionData, sessionOptions} from "@/lib/lib";
import {cookies} from "next/headers";

interface ReqBody {
    question: string;
    context?: string;
}

/**
 * Handler for API route to ask the AI a general question without any context.
 */
export async function POST(req: Request) {
    // Verify user is logged in
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }


    // Verify JSON body is provided
    let body: ReqBody;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
    }

    // Verify question is provided
    const { question, context } = body;
    if (!question) {
        return NextResponse.json({ message: "A question must be provided" }, { status: 400 });
    }

    // Send question to AI service
    const service: IAIService = getAIService();
    try {
        const response = await service.ask(question, context);
        return NextResponse.json({ message: response }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Sorry, something went wrong." }, { status: 500 });
    }
}