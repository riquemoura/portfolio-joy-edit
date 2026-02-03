-- Backup de segurança COMPLETO antes de implementar quebra de página
-- Data: 2026-02-03

CREATE TABLE IF NOT EXISTS public.products_backup_pagebreak (
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

-- Limpa backup anterior se existir e recria
TRUNCATE TABLE public.products_backup_pagebreak;

-- Copia todos os produtos atuais para a tabela de backup
INSERT INTO public.products_backup_pagebreak (id, catalog_id, name, description, price, image_url, position, created_at, updated_at)
SELECT id, catalog_id, name, description, price, image_url, position, created_at, updated_at
FROM public.products;

-- Habilita RLS
ALTER TABLE public.products_backup_pagebreak ENABLE ROW LEVEL SECURITY;

-- Permite apenas leitura pública do backup (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products_backup_pagebreak' 
    AND policyname = 'Permitir leitura pública do backup pagebreak'
  ) THEN
    CREATE POLICY "Permitir leitura pública do backup pagebreak" 
    ON public.products_backup_pagebreak 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Adiciona coluna is_page_break na tabela products para marcar quebras de página
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_page_break boolean NOT NULL DEFAULT false;