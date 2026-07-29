-- Registro privado que autoriza slugs publicos da campanha Founders 2026.
create table if not exists public.crm_founder_public_links (
  id uuid primary key default gen_random_uuid(),
  campaign_member_id uuid not null references public.crm_campaign_members(id) on delete cascade,
  slug text not null unique,
  enabled boolean not null default false,
  is_test boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_founder_public_links_slug_safe check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 8 and 100),
  constraint crm_founder_public_links_test_expiry check (not is_test or expires_at is not null),
  constraint crm_founder_public_links_test_slug check (not is_test or slug ~ '^teste-founder-[0-9a-f]{8,32}$')
);

create unique index if not exists uq_founder_public_links_enabled_member
  on public.crm_founder_public_links(campaign_member_id) where enabled;
create index if not exists idx_founder_public_links_resolve
  on public.crm_founder_public_links(slug) where enabled;

alter table public.crm_founder_public_links enable row level security;
alter table public.crm_founder_public_links force row level security;
revoke all on table public.crm_founder_public_links from public, anon, authenticated;
grant select, insert, update, delete on table public.crm_founder_public_links to service_role;

-- Falha fechada se qualquer numero protegido estiver ausente ou ambiguo.
do $$
declare v_number text;
begin
  foreach v_number in array array['001','002','003'] loop
    if (select count(*) from public.crm_campaign_members
        where campaign_id='founders-2026' and lpad(founder_number,3,'0')=v_number) <> 1 then
      raise exception 'Founder % ausente ou ambiguo em founders-2026', v_number;
    end if;
  end loop;
end $$;

insert into public.crm_founder_public_links(campaign_member_id,slug,enabled,is_test,expires_at)
select m.id, seed.slug, true, false, null
from (values ('001','benedito-constantino'),('002','jose-moreira'),('003','rikardo-oliveira')) seed(founder_number,slug)
join public.crm_campaign_members m on m.campaign_id='founders-2026' and lpad(m.founder_number,3,'0')=seed.founder_number
on conflict(slug) do update set
  campaign_member_id=excluded.campaign_member_id, enabled=true, is_test=false,
  expires_at=null, updated_at=now();
