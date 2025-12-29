import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEventSegmentationTools } from "./event-segmentation.js";
import { registerFunnelAnalysisTool } from "./funnel-analysis.js";
import { registerRetentionTool } from "./retention.js";
import { registerTaxonomyTools } from "./taxonomy.js";

export function registerAllTools(server: McpServer): void {
  // Taxonomy tools first - so agent discovers events before querying
  registerTaxonomyTools(server);
  registerEventSegmentationTools(server);
  registerFunnelAnalysisTool(server);
  registerRetentionTool(server);
}
