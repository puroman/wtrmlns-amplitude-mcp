import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts, loadProjectPrompts } from "./prompts/index.js";
import { getProjectDir } from "./utils/config.js";

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When running from dist/index.js, go up one level to project root
// When running from src/index.ts (dev), go up two levels
const projectRoot = __dirname.includes('/dist/') 
  ? resolve(__dirname, "..")
  : resolve(__dirname, "..", "..");
config({ path: resolve(projectRoot, ".env") });

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
