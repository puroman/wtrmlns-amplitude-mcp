import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts, loadProjectPrompts } from "./prompts/index.js";
import { getProjectDir } from "./utils/config.js";

// Create MCP server
export const server = new McpServer({
  name: "wtrmlns-amplitude-mcp",
  version: "0.1.0",
  description: "MCP server for Amplitude Analytics API"
});

// Register all tools
registerAllTools(server);

// Register resources
registerResources(server);

// Register generic prompts
registerPrompts(server);

// Load project-specific prompts if configured
const projectDir = getProjectDir();
if (projectDir) {
  await loadProjectPrompts(server, projectDir);
}

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
