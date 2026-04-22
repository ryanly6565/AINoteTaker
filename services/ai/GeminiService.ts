import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { IAIService } from "./IAIService";

export class GeminiService implements IAIService {
    private model: GenerativeModel

    public constructor(apiKey: string, model: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model });
    }

    async ask(question: string, context?: string): Promise<string> {
        let prompt = `Format the response as plaintext without any HTML or special formatting. My question is: ${question}`;
        
        // If context is provided, add it to the end of the prompt with clear instructions
        if (context) {
            prompt += `\n\nContext from note:\n${context}\n\nImportant: Only answer the specific question asked above. Do not reference or answer other questions that may appear in the context.`;
        }

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    async generateNotes(file: Blob): Promise<string> {
        // Convert file to Base64 string
        const arrayBuffer = await file.arrayBuffer();
        const data = (Buffer.from(arrayBuffer)).toString("base64");

        // Send request to gemini
        const prompt = "Could you generate some brief notes from the given file? Format the response as plaintext without any HTML or special formatting.";
        const imagePart = { inlineData: { data: data, mimeType: file.type } };
        const result = await this.model.generateContent([prompt, imagePart]);
        return result.response.text();
    }
}