-- Seed inicial: 1 organização Loud Fit + 5 unidades ativas + Anchieta arquivada.
-- Usuário admin deve ser vinculado depois via script (npm run seed:admin) após
-- o SEED_ADMIN_EMAIL ter feito login pela primeira vez (magic link).
--
-- Idempotente: pode rodar N vezes sem duplicar. Usa o slug da organização como
-- chave estável e resolve o id via subquery, evitando UUIDs literais frágeis.

insert into public.organizations (name, slug, timezone, currency)
values ('Loud Fit', 'loud-fit', 'America/Sao_Paulo', 'BRL')
on conflict (slug) do nothing;

insert into public.units (organization_id, name, slug, archived_at)
select org.id, u.name, u.slug, u.archived_at
from (select id from public.organizations where slug = 'loud-fit') as org
cross join (values
  ('Ipiranga',            'ipiranga',           null::timestamptz),
  ('Amoreiras',           'amoreiras',          null::timestamptz),
  ('Mogi Mirim',          'mogi-mirim',         null::timestamptz),
  ('Vila Industrial',     'vila-industrial',    null::timestamptz),
  ('Carrefour Valinhos',  'carrefour-valinhos', null::timestamptz),
  ('Anchieta',            'anchieta',           now())
) as u(name, slug, archived_at)
on conflict (organization_id, slug) do nothing;
