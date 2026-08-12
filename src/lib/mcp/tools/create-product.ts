import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "create_product",
  title: "Create product",
  description: "Add a product to a catalog. It is appended at the end of the catalog order.",
  inputSchema: {
    catalog_id: z.string().describe("Catalog id to add the product to."),
    name: z.string().describe("Product name."),
    price: z.number().describe("Product price."),
    description: z.string().optional().describe("Optional product description."),
    image_url: z.string().optional().describe("Optional public image URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ catalog_id, name, price, description, image_url }) => {
    const supabase = supabaseAnon();
    const { data: last } = await supabase
      .from("products")
      .select("position")
      .eq("catalog_id", catalog_id)
      .order("position", { ascending: false })
      .limit(1);
    const position = (last?.[0]?.position ?? -1) + 1;
    const { data, error } = await supabase
      .from("products")
      .insert({ catalog_id, name, price, description: description ?? null, image_url: image_url ?? null, position })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});