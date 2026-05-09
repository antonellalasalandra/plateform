"use client";

import { Bot, CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import {
  clearOpenAIConnection,
  maskOpenAIKey,
  OPENAI_CONNECTION_EVENT,
  readOpenAIConnection,
  writeOpenAIConnection
} from "@/lib/openai-connection-storage";

export function OpenAIConnectionCard() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [maskedKey, setMaskedKey] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    syncConnection();

    function onConnectionUpdate() {
      syncConnection();
    }

    window.addEventListener(OPENAI_CONNECTION_EVENT, onConnectionUpdate);
    return () => window.removeEventListener(OPENAI_CONNECTION_EVENT, onConnectionUpdate);
  }, []);

  function syncConnection() {
    const connection = readOpenAIConnection();
    setMaskedKey(connection ? maskOpenAIKey(connection.apiKey) : "");
    setModel(connection?.model ?? "gpt-4o");
  }

  function saveConnection() {
    if (!apiKey.trim()) {
      setNotice("Inserisci una OpenAI API key per collegare ChatGPT.");
      return;
    }

    if (!writeOpenAIConnection({ apiKey, model })) {
      setNotice("Non sono riuscito a salvare la connessione nel browser.");
      return;
    }

    setApiKey("");
    setNotice("ChatGPT collegato. L'analisi planimetrie e l'assistente useranno questa connessione.");
  }

  function removeConnection() {
    clearOpenAIConnection();
    setApiKey("");
    setNotice("Connessione rimossa.");
  }

  const isConnected = Boolean(maskedKey);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-3xl">
            <Bot className="size-7" />
            ChatGPT e analisi AI
          </CardTitle>
          <CardDescription>Collega una OpenAI API key per analisi planimetrie vision e assistente operativo in ogni tab.</CardDescription>
        </div>
        <div className="rounded-[6px] border border-line bg-slate-50 px-4 py-3 text-sm font-extrabold text-muted">
          {isConnected ? (
            <span className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-5" />
              Collegato
            </span>
          ) : (
            "Non collegato"
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_auto]">
          <label className="space-y-2">
            <span className="text-sm font-bold">OpenAI API key</span>
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={isConnected ? maskedKey : "sk-..."}
              autoComplete="off"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold">Modello</span>
            <Select value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4.1">gpt-4.1</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
            </Select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <Button type="button" onClick={saveConnection}>
              <KeyRound className="size-5" />
              Collega ChatGPT
            </Button>
            {isConnected ? (
              <Button type="button" variant="outline" onClick={removeConnection} aria-label="Rimuovi connessione OpenAI">
                <Trash2 className="size-5" />
              </Button>
            ) : null}
          </div>
        </div>
        {notice ? <p className="mt-3 text-sm font-semibold text-muted">{notice}</p> : null}
        <p className="mt-3 text-xs font-semibold text-muted">
          Per il prototipo la chiave resta nel browser. In produzione va salvata cifrata lato server o sostituita da una chiave di piattaforma.
        </p>
      </CardContent>
    </Card>
  );
}
