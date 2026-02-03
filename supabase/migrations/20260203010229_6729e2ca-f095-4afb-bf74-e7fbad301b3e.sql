-- Atualiza função RPC para incluir o campo is_page_break
CREATE OR REPLACE FUNCTION public.replace_catalog_products(p_catalog_id uuid, p_products jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_catalog_id IS NULL THEN
    RAISE EXCEPTION 'p_catalog_id is required';
  END IF;

  IF p_products IS NULL THEN
    p_products := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(p_products) <> 'array' THEN
    RAISE EXCEPTION 'p_products must be a JSON array';
  END IF;

  -- NOTE: This is executed inside a single transaction.
  -- If any insert fails (e.g., invalid price), the delete is rolled back.
  DELETE FROM public.products
  WHERE catalog_id = p_catalog_id;

  -- Insere produtos com position baseada na ordem do array e is_page_break
  INSERT INTO public.products (id, catalog_id, name, description, price, image_url, position, is_page_break)
  SELECT
    COALESCE(NULLIF(item->>'id', '')::uuid, gen_random_uuid()),
    p_catalog_id,
    COALESCE(item->>'name', ''),
    NULLIF(item->>'description', ''),
    COALESCE(NULLIF(item->>'price', '')::numeric, 0),
    NULLIF(item->>'image_url', ''),
    (row_number() OVER ()) - 1,  -- position começa em 0
    COALESCE((item->>'is_page_break')::boolean, false)
  FROM jsonb_array_elements(p_products) WITH ORDINALITY AS t(item, ord)
  ORDER BY ord;
END;
$function$;