"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
} from "ai";
import { useMemo, useRef, useState } from "react";
import type { ChatUITools, ChatUIMessage } from "./api/chat/agent";
import { defaultSystemPrompt } from "./api/chat/system-prompt";

function ToolCallPart({
  part,
}: {
  part: ToolUIPart<ChatUITools> | DynamicToolUIPart;
}) {
  const name = getToolName(part);
  const isRunning =
    part.state === "input-streaming" || part.state === "input-available";

  return (
    <details className="rounded-lg border border-foreground/15 bg-foreground/[0.03] px-3 py-2 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded font-medium marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
        <span aria-hidden>🔧</span>
        <span>{name}</span>
        {isRunning && (
          <span
            className="text-xs font-normal text-foreground/50"
            aria-live="polite"
          >
            ejecutando…
          </span>
        )}
      </summary>
      <div className="mt-2 space-y-2">
        {part.input !== undefined && (
          <div>
            <p className="text-xs font-medium text-foreground/50">
              Argumentos
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        )}
        {part.state === "output-available" && (
          <div>
            <p className="text-xs font-medium text-foreground/50">
              Resultado
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}
        {part.state === "output-error" && (
          <p className="text-red-600 dark:text-red-400">
            Error: {part.errorText}
          </p>
        )}
      </div>
    </details>
  );
}

export default function Chat() {
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [input, setInput] = useState("");

  // El transport lee el prompt más reciente sin recrearse en cada tecla.
  const systemPromptRef = useRef(systemPrompt);
  systemPromptRef.current = systemPrompt;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ system: systemPromptRef.current }),
      }),
    [],
  );

  const { messages, sendMessage, status, error, setMessages } =
    useChat<ChatUIMessage>({ transport });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">agents-101</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Agente ReAct con AI SDK + Gemini
        </p>
      </header>

      <details className="rounded-lg border border-foreground/15">
        <summary className="cursor-pointer select-none rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
          System prompt
        </summary>
        <div className="space-y-3 border-t border-foreground/10 px-4 py-3">
          <label
            htmlFor="system-prompt"
            className="block text-xs font-medium text-foreground/60"
          >
            Instrucciones para el agente
          </label>
          <textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-md border border-foreground/20 bg-transparent p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-foreground/50">
              Se aplica desde el próximo mensaje que envíes.
            </p>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              Reiniciar conversación
            </button>
          </div>
        </div>
      </details>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-foreground/50">
            Empieza la conversación escribiendo un mensaje.
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id}>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
              {message.role === "user" ? "Tú" : "Agente"}
            </p>
            <div className="mt-1 space-y-2">
              {message.parts.map((part, i) => {
                const key = `${message.id}-${i}`;
                if (part.type === "text") {
                  return (
                    <p
                      key={key}
                      className="whitespace-pre-wrap text-sm sm:text-base"
                    >
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "step-start") {
                  return i > 0 ? (
                    <hr key={key} className="border-foreground/10" />
                  ) : null;
                }
                if (isToolUIPart(part)) {
                  return <ToolCallPart key={key} part={part} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {isBusy && (
          <p className="text-sm text-foreground/50" aria-live="polite">
            El agente está pensando…
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error?.message ?? "Ocurrió un error al contactar al agente."}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Mensaje
          </label>
          <input
            id="chat-input"
            name="message"
            type="text"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje…"
            className="w-full rounded-md border border-foreground/20 bg-transparent p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isBusy}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {isBusy ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}
