import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-black px-5">
      <Card className="w-full max-w-[440px] border-white/10 bg-white p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-[8px] bg-ink">
            <Image src="/plateform-logo.png" alt="Plateform" width={38} height={38} className="rounded-[4px]" priority />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Plateform</h1>
            <p className="text-sm font-bold text-muted">Accesso gestionale</p>
          </div>
        </div>

        <form className="space-y-4">
          <label className="space-y-2 block">
            <span className="text-sm font-bold">Email</span>
            <Input type="email" defaultValue="admin@plateform.it" />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-bold">Password</span>
            <Input type="password" defaultValue="plateform-demo" />
          </label>
          <Link
            href="/panoramica"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Entra
            <ArrowRight className="size-5" />
          </Link>
        </form>
      </Card>
    </main>
  );
}
