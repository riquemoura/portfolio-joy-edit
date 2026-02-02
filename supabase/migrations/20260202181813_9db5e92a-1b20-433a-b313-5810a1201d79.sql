-- Adicionar campo de posição para ordenação manual dos produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS position INTEGER;

-- Atualizar produtos existentes com posição baseada na ordem atual (created_at)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY catalog_id ORDER BY created_at ASC) - 1 as pos
  FROM public.products
)
UPDATE public.products p
SET position = n.pos
FROM numbered n
WHERE p.id = n.id;

-- Tornar position NOT NULL com default 0 após popular os dados existentes
ALTER TABLE public.products ALTER COLUMN position SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN position SET DEFAULT 0;

-- Criar índice para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_products_catalog_position ON public.products(catalog_id, position);