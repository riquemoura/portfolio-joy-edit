-- SAVEPOINT: Criar tabela de backup com todos os produtos atuais
-- Esta tabela serve como cópia de segurança antes de qualquer alteração

CREATE TABLE IF NOT EXISTS public.products_backup_20260202 (
  id UUID NOT NULL,
  catalog_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, backed_up_at)
);

-- Copiar todos os produtos atuais para o backup
INSERT INTO public.products_backup_20260202 (id, catalog_id, name, description, price, image_url, created_at, updated_at)
SELECT id, catalog_id, name, description, price, image_url, created_at, updated_at
FROM public.products;

-- Adicionar comentário para documentação
COMMENT ON TABLE public.products_backup_20260202 IS 'Backup de segurança dos produtos criado em 02/02/2026 antes de correções no sistema de salvamento';