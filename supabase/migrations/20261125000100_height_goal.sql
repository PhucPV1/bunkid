-- Spec 2026-11-25 §6.1: the parents' heights and the adult height the family
-- aims for. All three are optional. RLS is unchanged: every member reads,
-- only the owner writes (babies_update).
alter table public.babies
  add column father_height_cm numeric(4, 1)
    check (father_height_cm is null or father_height_cm between 120 and 220),
  add column mother_height_cm numeric(4, 1)
    check (mother_height_cm is null or mother_height_cm between 120 and 220),
  add column target_height_cm numeric(4, 1)
    check (target_height_cm is null or target_height_cm between 120 and 220);
