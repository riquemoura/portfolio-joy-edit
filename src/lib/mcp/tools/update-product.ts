import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "update_product",
  title: "Update product",
  description: "Update name, price, description or image of an existing product.",
  inputSchema: {
    id: z.string().describe("Product id."),
    name: z.string().optional(),
    price: z.number().optional(),
    description: z.string().optional(),
    image_url: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id, name, price, description, image_url }) => {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (Object.keys(updates).length === 0) {
      return { content: [{ type: "text", text: "No fields to update." }], isError: true };
    }
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("products")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});