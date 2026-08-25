import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAsCaller } from "../supabase";

export default defineTool({
  name: "delete_product",
  title: "Delete product",
  description: "Permanently delete a product from its catalog.",
  inputSchema: { id: z.string().describe("Product id to delete.") },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const supabase = supabaseAsCaller(ctx);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Deleted product ${id}` }] };
  },
});
