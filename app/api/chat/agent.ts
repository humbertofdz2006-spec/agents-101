import { google } from "@ai-sdk/google";
import { InferUITools, UIMessage } from "ai";

export { defaultSystemPrompt } from "./system-prompt";

export const model = google("gemini-flash-latest");

// Sin tools todavía — agrega las tuyas aquí, ej: { weather: tool({ ... }) }
export const agentTools = {};

export type ChatUITools = InferUITools<typeof agentTools>;
export type ChatUIMessage = UIMessage<never, never, ChatUITools>;
