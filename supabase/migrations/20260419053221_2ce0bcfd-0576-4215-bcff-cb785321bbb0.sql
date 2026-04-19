
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS kamar_mandi varchar,
  ADD COLUMN IF NOT EXISTS luas_bangunan varchar;
