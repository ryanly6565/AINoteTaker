import { GeminiService } from "./GeminiService";
import { IAIService } from "./IAIService";

let instance: IAIService | null = null;

export function getAIService(): IAIService {
	if (!instance) {
		const apiKey = process.env.GEMINI_API_KEY || "";
		if (!apiKey) {
			console.error("AI API key is missing.");
		}

		const model = process.env.GEMINI_MODEL || "";
		if (!model) {
			console.error("AI Model not specified.");
		}

		instance = new GeminiService(apiKey, model);
	}

	return instance;
}