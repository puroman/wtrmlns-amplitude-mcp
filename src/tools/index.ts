import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEventSegmentationTools } from "./event-segmentation.js";
import { registerTaxonomyTools } from "./taxonomy.js";

export function registerAllTools(server: McpServer): void {
  // Taxonomy tools first - so agent discovers events before querying
  registerTaxonomyTools(server);
  registerEventSegmentationTools(server);
}
