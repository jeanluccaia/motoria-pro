import Image from "next/image";
import { LogOut } from "lucide-react";
import type { Session } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/labels";
import loudfitLockup from "@/../public/brand/loudfit-lockup.png";

export function Topbar({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-lf-black/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Image
          src={loudfitLockup}
          alt="Loud Fit"
          className="h-5 w-auto"
          sizes="80px"
          priority
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lf-muted">
          Loud Flow
        </span>
      </div>

      <div className="hidden text-xs uppercase tracking-widest text-lf-muted md:block">
        {session.organizationName}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm leading-tight">
            {session.name ?? session.email}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-lf-muted">
            {roleLabel(session.role)}
          </div>
        </div>
        <div
          className="grid size-9 place-items-center rounded-full border border-border bg-lf-surface text-xs font-medium"
          aria-hidden
        >
          {(session.name ?? session.email).slice(0, 1).toUpperCase()}
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="grid size-9 place-items-center rounded border border-transparent text-lf-muted transition-colors hover:border-border hover:text-foreground lf-focus"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
