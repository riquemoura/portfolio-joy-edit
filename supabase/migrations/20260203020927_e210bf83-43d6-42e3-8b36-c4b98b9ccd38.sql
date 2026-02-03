-- BACKUP DE SEGURANÇA: Salvando todos os produtos antes de implementar exportação de cards
-- Este backup preserva todos os dados incluindo a nova coluna is_page_break

CREATE TABLE IF NOT EXISTS public.products_backup_cards_feature (
  id uuid NOT NULL,
  catalog_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  position integer NOT NULL DEFAULT 0,
  is_page_break boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  backed_up_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, backed_up_at)
);

-- Copia todos os produtos atuais para o backup
INSERT INTO public.products_backup_cards_feature (
  id, catalog_id, name, description, price, image_url, position, is_page_break, created_at, updated_at
)
SELECT 
  id, catalog_id, name, description, price, image_url, position, is_page_break, created_at, updated_at
FROM public.products;

-- Política de leitura pública para o backup
ALTER TABLE public.products_backup_cards_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública do backup cards"
  ON public.products_backup_cards_feature
  FOR SELECT
  USING (true);