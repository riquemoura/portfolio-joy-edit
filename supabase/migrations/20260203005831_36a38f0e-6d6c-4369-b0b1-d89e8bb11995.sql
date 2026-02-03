-- Backup de segurança dos produtos antes de modificar a função de reordenação
-- Data: 2026-02-03

CREATE TABLE IF NOT EXISTS public.products_backup_20260203_reorder (
  id uuid NOT NULL,
  catalog_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  backed_up_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Copia todos os produtos atuais para a tabela de backup
INSERT INTO public.products_backup_20260203_reorder (id, catalog_id, name, description, price, image_url, position, created_at, updated_at)
SELECT id, catalog_id, name, description, price, image_url, position, created_at, updated_at
FROM public.products;

-- Habilita RLS
ALTER TABLE public.products_backup_20260203_reorder ENABLE ROW LEVEL SECURITY;

-- Permite apenas leitura pública do backup
CREATE POLICY "Permitir leitura pública do backup reorder" 
ON public.products_backup_20260203_reorder 
FOR SELECT 
USING (true);