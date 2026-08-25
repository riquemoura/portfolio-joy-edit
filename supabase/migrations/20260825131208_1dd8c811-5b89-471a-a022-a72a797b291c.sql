-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio perfil"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza seu próprio perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'phone', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. catalogs: leitura pública, escrita só autenticado
DROP POLICY IF EXISTS "Permitir inserção pública de catálogos" ON public.catalogs;
DROP POLICY IF EXISTS "Permitir atualização pública de catálogos" ON public.catalogs;
DROP POLICY IF EXISTS "Permitir exclusão pública de catálogos" ON public.catalogs;

CREATE POLICY "Catálogos: criar autenticado"
  ON public.catalogs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Catálogos: atualizar autenticado"
  ON public.catalogs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Catálogos: excluir autenticado"
  ON public.catalogs FOR DELETE TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.catalogs FROM anon;
GRANT SELECT ON public.catalogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogs TO authenticated;
GRANT ALL ON public.catalogs TO service_role;

-- 3. products
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.products;
DROP POLICY IF EXISTS "Permitir atualização pública" ON public.products;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.products;

CREATE POLICY "Produtos: criar autenticado"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Produtos: atualizar autenticado"
  ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Produtos: excluir autenticado"
  ON public.products FOR DELETE TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 4. tabelas de backup: sem acesso público
DROP POLICY IF EXISTS "Permitir leitura pública do backup" ON public.products_backup_20260202;
DROP POLICY IF EXISTS "Permitir leitura pública do backup reorder" ON public.products_backup_20260203_reorder;
DROP POLICY IF EXISTS "Permitir leitura pública do backup bulk edit" ON public.products_backup_bulk_edit;
DROP POLICY IF EXISTS "Permitir leitura pública do backup cards" ON public.products_backup_cards_feature;
DROP POLICY IF EXISTS "Permitir leitura pública do backup pagebreak" ON public.products_backup_pagebreak;

REVOKE ALL ON public.products_backup_20260202 FROM anon, authenticated;
REVOKE ALL ON public.products_backup_20260203_reorder FROM anon, authenticated;
REVOKE ALL ON public.products_backup_bulk_edit FROM anon, authenticated;
REVOKE ALL ON public.products_backup_cards_feature FROM anon, authenticated;
REVOKE ALL ON public.products_backup_pagebreak FROM anon, authenticated;

GRANT ALL ON public.products_backup_20260202 TO service_role;
GRANT ALL ON public.products_backup_20260203_reorder TO service_role;
GRANT ALL ON public.products_backup_bulk_edit TO service_role;
GRANT ALL ON public.products_backup_cards_feature TO service_role;
GRANT ALL ON public.products_backup_pagebreak TO service_role;

-- 5. storage: product-images
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND qual ILIKE '%product-images%' OR with_check ILIKE '%product-images%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Imagens de produto: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Imagens de produto: enviar autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Imagens de produto: atualizar autenticado"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Imagens de produto: excluir autenticado"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');