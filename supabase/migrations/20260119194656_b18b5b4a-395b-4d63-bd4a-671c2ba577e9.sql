-- Tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (catálogo sem autenticação)
CREATE POLICY "Permitir leitura pública" ON public.products FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.products FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket para imagens
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Políticas de storage
CREATE POLICY "Imagens públicas" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Upload público" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Delete público" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
CREATE POLICY "Update público" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');