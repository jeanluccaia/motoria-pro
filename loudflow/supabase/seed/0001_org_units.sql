-- Seed inicial: 1 organização Loud Fit + 5 unidades ativas + Anchieta arquivada.
-- Usuário admin deve ser vinculado depois via script (npm run seed:admin) após
-- o SEED_ADMIN_EMAIL ter feito login pela primeira vez (magic link).

insert into public.organizations (id, name, slug, timezone, currency)
values ('00000000-0000-0000-0000-00000000loud', 'Loud Fit', 'loud-fit', 'America/Sao_Paulo', 'BRL')
on conflict (slug) do nothing;

insert into public.units (organization_id, name, slug, archived_at) values
  ('00000000-0000-0000-0000-00000000loud', 'Ipiranga',            'ipiranga',           null),
  ('00000000-0000-0000-0000-00000000loud', 'Amoreiras',           'amoreiras',          null),
  ('00000000-0000-0000-0000-00000000loud', 'Mogi Mirim',          'mogi-mirim',         null),
  ('00000000-0000-0000-0000-00000000loud', 'Vila Industrial',     'vila-industrial',    null),
  ('00000000-0000-0000-0000-00000000loud', 'Carrefour Valinhos',  'carrefour-valinhos', null),
  ('00000000-0000-0000-0000-00000000loud', 'Anchieta',            'anchieta',           now())
on conflict (organization_id, slug) do nothing;
