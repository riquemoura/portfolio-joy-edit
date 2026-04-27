CREATE TABLE IF NOT EXISTS public.products_backup_bulk_edit AS
SELECT *, now() AS backed_up_at FROM public.products;

ALTER TABLE public.products_backup_bulk_edit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública do backup bulk edit"
ON public.products_backup_bulk_edit
FOR SELECT
USING (true);