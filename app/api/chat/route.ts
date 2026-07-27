import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { agentTools, defaultSystemPrompt, model, type ChatUIMessage } from "./agent";

export async function POST(req: Request) {
  const { messages, system }: { messages: ChatUIMessage[]; system?: string } =
    await req.json();

  const result = streamText({
    model,
    system: system?.trim() || defaultSystemPrompt,
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
