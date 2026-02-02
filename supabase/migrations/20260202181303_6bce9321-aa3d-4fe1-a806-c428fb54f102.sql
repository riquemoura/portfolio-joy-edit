-- Habilitar RLS na tabela de backup (somente leitura para consulta)
ALTER TABLE public.products_backup_20260202 ENABLE ROW LEVEL SECURITY;

-- Permitir apenas leitura pública (backup é somente consulta)
CREATE POLICY "Permitir leitura pública do backup" 
ON public.products_backup_20260202 
FOR SELECT 
USING (true);