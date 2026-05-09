import { NextRequest, NextResponse } from "next/server";

const roomSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rooms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: ["dining", "kitchen", "service", "other"] },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          confidence: { type: "number" }
        },
        required: ["name", "kind", "x", "y", "width", "height", "confidence"]
      }
    },
    tables: {
      type: "array",
      items: tableSchema()
    }
  },
  required: ["rooms", "tables"]
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI non collegato." }, { status: 401 });
    }

    const body = (await request.json()) as { imageDataUrl?: string; mode?: "single-room" | "complete-plan"; model?: string };
    if (!body.imageDataUrl || typeof body.imageDataUrl !== "string") {
      return NextResponse.json({ error: "Immagine mancante." }, { status: 400 });
    }

    const mode = body.mode === "complete-plan" ? "complete-plan" : "single-room";
    const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4o";
    const schema = mode === "complete-plan" ? roomSchema : { type: "object", additionalProperties: false, properties: { tables: { type: "array", items: tableSchema() } }, required: ["tables"] };

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
              "Sei un motore di analisi planimetrie per ristoranti. Devi leggere immagini di planimetrie, riconoscere sale operative e tavoli. Restituisci solo JSON valido nello schema richiesto. Coordinate e dimensioni sono percentuali 0-100 rispetto all'immagine completa. Per i tavoli usa il centro del tavolo in x/y e una stima del rettangolo in width/height. Non inventare tavoli se non ci sono segni coerenti."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  mode === "complete-plan"
                    ? "Analizza questa planimetria completa. Individua sale, cucina, servizi/ambienti non operativi e tutti i tavoli visibili."
                    : "Analizza questa planimetria di una singola sala. Individua tutti i tavoli visibili, anche se sono piccoli o stilizzati."
              },
              {
                type: "input_image",
                image_url: body.imageDataUrl
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: mode === "complete-plan" ? "floor_plan_rooms_and_tables" : "floor_plan_tables",
            schema,
            strict: true
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: extractOpenAIError(data) }, { status: response.status });
    }

    const parsed = parseJsonResponse(data);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Non sono riuscito ad analizzare la planimetria con OpenAI." }, { status: 500 });
  }
}

function tableSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      x: { type: "number" },
      y: { type: "number" },
      width: { type: "number" },
      height: { type: "number" },
      confidence: { type: "number" }
    },
    required: ["x", "y", "width", "height", "confidence"]
  };
}

function parseJsonResponse(data: unknown) {
  const text = extractResponseText(data);
  if (!text) return { tables: [] };

  try {
    return JSON.parse(text);
  } catch {
    return { tables: [] };
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
