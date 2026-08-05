"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUnit } from "./actions";

export function NewUnitForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await createUnit(formData);
      setResult(r);
      if (r.ok) {
        (document.getElementById("new-unit-form") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <form id="new-unit-form" action={onSubmit} className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit-name">Nome</Label>
        <Input id="unit-name" name="name" required placeholder="Ex.: Ipiranga" disabled={pending} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit-slug">Slug (opcional)</Label>
        <Input id="unit-slug" name="slug" placeholder="ex.: ipiranga" disabled={pending} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Criando..." : "Criar unidade"}
        </Button>
      </div>

      {result ? (
        <p className={"sm:col-span-3 text-sm " + (result.ok ? "text-lf-muted" : "text-destructive")}>
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
