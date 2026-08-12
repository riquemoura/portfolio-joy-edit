import { defineMcp } from "@lovable.dev/mcp-js";
import listCatalogsTool from "./tools/list-catalogs";
import listProductsTool from "./tools/list-products";
import createProductTool from "./tools/create-product";
import updateProductTool from "./tools/update-product";
import deleteProductTool from "./tools/delete-product";

export default defineMcp({
  name: "my-joyful-portfolio",
  title: "My Joyful Portfolio",
  version: "0.1.0",
  instructions:
    "Tools for the product catalog app. Use `list_catalogs` to find a catalog id, `list_products` to read its products in display order, and `create_product` / `update_product` / `delete_product` to manage items. Prices are numbers in BRL.",
  tools: [listCatalogsTool, listProductsTool, createProductTool, updateProductTool, deleteProductTool],
});