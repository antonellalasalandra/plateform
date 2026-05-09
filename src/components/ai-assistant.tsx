"use client";

import { Bot, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { OPENAI_CONNECTION_EVENT, readOpenAIConnection } from "@/lib/openai-connection-storage";
import { cn } from "@/lib/utils";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ciao, sono l'assistente Plateform. Posso aiutarti a leggere questa schermata, impostare sale/tavoli, prenotazioni, turni o magazzino."
    }
  ]);

  useEffect(() => {
    syncConnection();

    function onConnectionUpdate() {
      syncConnection();
    }

    window.addEventListener(OPENAI_CONNECTION_EVENT, onConnectionUpdate);
    return () => window.removeEventListener(OPENAI_CONNECTION_EVENT, onConnectionUpdate);
  }, []);

  function syncConnection() {
    setIsConnected(Boolean(readOpenAIConnection()));
  }

  const pageContext = useMemo(() => {
    if (typeof window === "undefined") return "gestionale";
    return window.location.pathname.replace("/", "") || "panoramica";
  }, [isOpen]);

  async function sendMessage() {
    const content = input.trim();
    const connection = readOpenAIConnection();

    if (!content || isSending) return;
    if (!connection) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Per usare l'assistente collega prima ChatGPT/OpenAI dalle Impostazioni."
        }
      ]);
      setIsOpen(true);
      return;
    }

    const userMessage: AssistantMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-api-key": connection.apiKey
        },
        body: JSON.stringify({
          model: connection.model,
          page: pageContext,
          messages: nextMessages.map(({ role, content }) => ({ role, content }))
        })
      });
      const data = (await response.json()) as { message?: string; error?: string };
      const assistantContent = response.ok ? data.message || "Non ho ricevuto una risposta." : data.error || "OpenAI non ha risposto.";

      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: assistantContent }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Non sono riuscito a contattare l'assistente. Controlla la connessione OpenAI nelle impostazioni."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="w-[min(calc(100vw-40px),420px)] overflow-hidden rounded-[8px] border border-line bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-[6px] bg-ink text-white">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">Assistente Plateform</p>
                <p className="text-xs font-bold text-muted">{isConnected ? `Attivo su ${pageContext}` : "Collega ChatGPT in Impostazioni"}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" className="size-9 px-0" onClick={() => setIsOpen(false)} aria-label="Chiudi assistente">
              <X className="size-5" />
            </Button>
          </header>

          <div className="max-h-[360px] space-y-3 overflow-y-auto bg-slate-50 p-4 thin-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[86%] rounded-[8px] px-3 py-2 text-sm font-semibold leading-relaxed",
                  message.role === "user" ? "ml-auto bg-ink text-white" : "bg-white text-ink shadow-sm"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="grid gap-2 border-t border-line p-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Chiedi qualcosa su questa schermata..."
              className="min-h-20 resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || isSending}>
              <Send className="size-5" />
              {isSending ? "Invio..." : "Invia"}
            </Button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="grid size-14 place-items-center rounded-full bg-ink text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Apri assistente Plateform"
      >
        <Bot className="size-6" />
      </button>
    </div>
  );
}
