import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI non collegato." }, { status: 401 });
    }

    const body = (await request.json()) as { messages?: ChatMessage[]; page?: string; model?: string };
    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4o";
    const page = typeof body.page === "string" ? body.page : "gestionale";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Sei l'assistente operativo di Plateform, un gestionale per ristoranti e pizzerie. Rispondi in italiano, in modo pratico e conciso. Aiuta l'utente a capire dashboard, prenotazioni, sala live, personale, magazzino, menu e impostazioni. Se manca un dato, spiega il passaggio più utile da fare nell'app."
          },
          {
            role: "user",
            content: `Contesto pagina attuale: ${page}`
          },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content
          }))
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: extractOpenAIError(data) }, { status: response.status });
    }

    return NextResponse.json({ message: extractResponseText(data) || "Non ho ricevuto una risposta utilizzabile." });
  } catch {
    return NextResponse.json({ error: "Non sono riuscito a contattare OpenAI." }, { status: 500 });
  }
}

function extractResponseText(data: unknown) {
  if (typeof data === "object" && data && "output_text" in data && typeof (data as { output_text?: unknown }).output_text === "string") {
    return (data as { output_text: string }).output_text;
  }

  const output = (data as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }> })?.output;
  return output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractOpenAIError(data: unknown) {
  const message = (data as { error?: { message?: string } })?.error?.message;
  return message || "OpenAI ha restituito un errore.";
}
