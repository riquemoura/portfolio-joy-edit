import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List products of a catalog in their manual display order.",
  inputSchema: {
    catalog_id: z.string().describe("Catalog id returned by list_catalogs."),
    include_page_breaks: z.boolean().optional().describe("Include page-break markers (default false)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ catalog_id, include_page_breaks }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("products")
      .select("id, name, description, price, image_url, position, is_page_break")
      .eq("catalog_id", catalog_id)
      .order("position", { ascending: true });
    if (!include_page_breaks) query = query.eq("is_page_break", false);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});