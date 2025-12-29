import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eventsResourceTemplate, eventsResourceHandler } from "./events.js";

export function registerResources(server: McpServer): void {
  server.resource("amplitude_events", eventsResourceTemplate, eventsResourceHandler);
}
