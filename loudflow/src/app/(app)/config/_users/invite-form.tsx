"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser } from "./actions";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "marketing", label: "Marketing" },
  { value: "partner", label: "Sócio" },
  { value: "unit_manager", label: "Gestor de unidade" },
] as const;

export function InviteUserForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await inviteUser(formData);
      setResult(r);
      if (r.ok) {
        (document.getElementById("invite-form") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <form id="invite-form" action={onSubmit} className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_180px_auto]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="nome@loudfit.com.br"
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Papel</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="marketing"
          disabled={pending}
          className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Enviando..." : "Enviar convite"}
        </Button>
      </div>

      {result ? (
        <p
          className={
            "sm:col-span-3 text-sm " +
            (result.ok ? "text-lf-muted" : "text-destructive")
          }
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
