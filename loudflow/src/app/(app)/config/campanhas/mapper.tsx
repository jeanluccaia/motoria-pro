"use client";

import { useState, useTransition } from "react";
import { assignCampaignUnit } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UnitOpt = { id: string; name: string };

type CampaignRow = {
  id: string;
  name: string;
  provider: "meta" | "google";
  externalAccountName: string | null;
  status: string | null;
  unitId: string | null;
  unitSource: "auto" | "manual" | "unresolved";
};

export function CampaignsMapper({
  campaigns,
  units,
}: {
  campaigns: CampaignRow[];
  units: UnitOpt[];
}) {
  return (
    <ul className="space-y-3">
      {campaigns.map((c) => (
        <CampaignItem key={c.id} campaign={c} units={units} />
      ))}
    </ul>
  );
}

function CampaignItem({ campaign, units }: { campaign: CampaignRow; units: UnitOpt[] }) {
  const [selected, setSelected] = useState<string>(campaign.unitId ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(true);

  const dirty = (campaign.unitId ?? "") !== selected;

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{campaign.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-lf-muted">
            <Badge variant={campaign.provider === "meta" ? "outline" : "muted"}>
              {campaign.provider === "meta" ? "Meta Ads" : "Google Ads"}
            </Badge>
            {campaign.externalAccountName ? <span>{campaign.externalAccountName}</span> : null}
            {campaign.status ? <span>· {campaign.status}</span> : null}
            <SourceBadge source={campaign.unitSource} />
          </div>
        </div>
      </div>

      <form
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
        action={(fd) => {
          fd.set("campaign_id", campaign.id);
          fd.set("unit_id", selected);
          setMessage(null);
          startTransition(async () => {
            const result = await assignCampaignUnit(fd);
            setOk(result.ok);
            setMessage(result.message);
          });
        }}
      >
        <label className="sr-only" htmlFor={`unit-${campaign.id}`}>
          Unidade
        </label>
        <select
          id={`unit-${campaign.id}`}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-11 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
        >
          <option value="">Sem unidade</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!dirty || pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
      {message ? (
        <p
          role="status"
          className={"mt-2 text-xs " + (ok ? "text-lf-muted" : "text-destructive")}
        >
          {message}
        </p>
      ) : null}
    </li>
  );
}

function SourceBadge({ source }: { source: CampaignRow["unitSource"] }) {
  if (source === "manual") return <Badge variant="default">Manual</Badge>;
  if (source === "auto") return <Badge variant="outline">Automático</Badge>;
  return <Badge variant="muted">Sem unidade</Badge>;
}
