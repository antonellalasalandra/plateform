"use client";

export type OpenAIConnection = {
  apiKey: string;
  model: string;
};

export const OPENAI_CONNECTION_EVENT = "plateform:openai-connection-updated";
const OPENAI_CONNECTION_STORAGE_KEY = "plateform-openai-connection-v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o";

export function readOpenAIConnection() {
  if (typeof window === "undefined") return null;

  try {
    const rawConnection = window.localStorage.getItem(OPENAI_CONNECTION_STORAGE_KEY);
    if (!rawConnection) return null;
    const parsed = JSON.parse(rawConnection) as Partial<OpenAIConnection>;
    if (!parsed.apiKey || typeof parsed.apiKey !== "string") return null;

    return {
      apiKey: parsed.apiKey,
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model : DEFAULT_OPENAI_MODEL
    } satisfies OpenAIConnection;
  } catch {
    return null;
  }
}

export function writeOpenAIConnection(connection: OpenAIConnection) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      OPENAI_CONNECTION_STORAGE_KEY,
      JSON.stringify({
        apiKey: connection.apiKey.trim(),
        model: connection.model.trim() || DEFAULT_OPENAI_MODEL
      })
    );
    window.dispatchEvent(new CustomEvent(OPENAI_CONNECTION_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearOpenAIConnection() {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(OPENAI_CONNECTION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(OPENAI_CONNECTION_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function maskOpenAIKey(apiKey: string) {
  if (!apiKey) return "";
  if (apiKey.length <= 12) return "••••";
  return `${apiKey.slice(0, 7)}••••${apiKey.slice(-4)}`;
}
