-- Criar tabela de catálogos
CREATE TABLE public.catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Meu Catálogo',
  background_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para catálogos (acesso público por enquanto)
CREATE POLICY "Permitir leitura pública de catálogos" 
ON public.catalogs FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de catálogos" 
ON public.catalogs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de catálogos" 
ON public.catalogs FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública de catálogos" 
ON public.catalogs FOR DELETE USING (true);

-- Adicionar coluna catalog_id na tabela products
ALTER TABLE public.products ADD COLUMN catalog_id UUID REFERENCES public.catalogs(id) ON DELETE CASCADE;

-- Criar catálogo padrão para os produtos existentes
INSERT INTO public.catalogs (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Meu Catálogo');

-- Migrar todos os produtos existentes para o catálogo padrão
UPDATE public.products SET catalog_id = '00000000-0000-0000-0000-000000000001' WHERE catalog_id IS NULL;

-- Tornar catalog_id obrigatório após migração
ALTER TABLE public.products ALTER COLUMN catalog_id SET NOT NULL;

-- Adicionar trigger para atualizar updated_at nos catálogos
CREATE TRIGGER update_catalogs_updated_at
BEFORE UPDATE ON public.catalogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();