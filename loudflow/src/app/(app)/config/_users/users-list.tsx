"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { changeRole, removeUser } from "./actions";
import type { Role } from "@/lib/supabase/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "marketing", label: "Marketing" },
  { value: "partner", label: "Sócio" },
  { value: "unit_manager", label: "Gestor de unidade" },
];

export function UsersList({
  users,
  currentUserId,
}: {
  users: { id: string; email: string; name: string | null; role: Role; roleLabel: string }[];
  currentUserId: string;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {users.map((u) => (
        <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
      ))}
    </ul>
  );
}

function UserRow({
  user,
  isSelf,
}: {
  user: { id: string; email: string; name: string | null; role: Role };
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as Role;
    const fd = new FormData();
    fd.set("user_id", user.id);
    fd.set("role", role);
    startTransition(async () => {
      await changeRole(fd);
    });
  }

  function onRemove() {
    if (!confirm(`Remover ${user.email} da organização?`)) return;
    const fd = new FormData();
    fd.set("user_id", user.id);
    startTransition(async () => {
      await removeUser(fd);
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-lf-surface text-xs">
          {(user.name ?? user.email).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user.name ?? user.email}
            {isSelf ? <Badge variant="muted" className="ml-2">você</Badge> : null}
          </p>
          <p className="truncate text-xs text-lf-muted">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          defaultValue={user.role}
          onChange={onRoleChange}
          disabled={pending}
          className="h-9 rounded-md border border-input bg-lf-graphite px-2 text-sm text-foreground lf-focus"
          aria-label={`Papel de ${user.email}`}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={pending || isSelf}
          title={isSelf ? "Você não pode remover a si mesmo" : "Remover"}
          aria-label="Remover"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
