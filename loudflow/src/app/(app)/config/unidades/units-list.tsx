"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { renameUnit, toggleArchive } from "./actions";
import type { Unit } from "@/lib/supabase/types";

export function UnitsList({ units }: { units: Unit[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {units.map((u) => (
        <UnitRow key={u.id} unit={u} />
      ))}
    </ul>
  );
}

function UnitRow({ unit }: { unit: Unit }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(unit.name);
  const [pending, startTransition] = useTransition();
  const archived = !!unit.archived_at;

  function save() {
    const fd = new FormData();
    fd.set("id", unit.id);
    fd.set("name", name.trim() || unit.name);
    startTransition(async () => {
      await renameUnit(fd);
      setEditing(false);
    });
  }

  function cancel() {
    setName(unit.name);
    setEditing(false);
  }

  function toggle() {
    const fd = new FormData();
    fd.set("id", unit.id);
    fd.set("archived", archived ? "false" : "true");
    startTransition(async () => {
      await toggleArchive(fd);
    });
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-2 shrink-0 rounded-full" style={{ background: archived ? "var(--lf-muted)" : "var(--lf-volt)" }} aria-hidden />
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            className="max-w-xs"
            autoFocus
          />
        ) : (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{unit.name}</p>
            <p className="truncate text-xs text-lf-muted">/{unit.slug}</p>
          </div>
        )}
        {archived ? <Badge variant="muted">Arquivada</Badge> : null}
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              <Check className="size-4" /> Salvar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}>
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              disabled={pending || archived}
              title="Editar nome"
            >
              <Pencil className="size-4" /> Renomear
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggle}
              disabled={pending}
            >
              {archived ? (
                <>
                  <ArchiveRestore className="size-4" /> Reativar
                </>
              ) : (
                <>
                  <Archive className="size-4" /> Arquivar
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
