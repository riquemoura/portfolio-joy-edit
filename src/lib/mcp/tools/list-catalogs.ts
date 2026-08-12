import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_catalogs",
  title: "List catalogs",
  description: "List all catalogs with their id, name and product count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("catalogs")
      .select("id, name, created_at, updated_at, products(count)")
      .order("created_at", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const catalogs = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      productCount: c.products?.[0]?.count ?? 0,
      updatedAt: c.updated_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(catalogs, null, 2) }],
      structuredContent: { catalogs },
    };
  },
});