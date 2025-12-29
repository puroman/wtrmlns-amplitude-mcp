import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { resolve, join } from "path";

// Helper to format dates for prompts
const formatDateRange = (range: string): { start: string; end: string; description: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  switch (range) {
    case 'last_7_days': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: fmt(start), end: fmt(now), description: 'last 7 days' };
    }
    case 'last_30_days': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: fmt(start), end: fmt(now), description: 'last 30 days' };
    }
    case 'last_90_days': {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start: fmt(start), end: fmt(now), description: 'last 90 days' };
    }
    default:
      return { start: fmt(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), end: fmt(now), description: 'last 30 days' };
  }
};

export function registerPrompts(server: McpServer): void {
  // Prompt: Analyze user journey
  server.prompt(
    "analyze_user_journey",
    "Analyze a specific user's event history and behavior patterns",
    {
      user_identifier: z.string().describe("User ID, device ID, or Amplitude ID to analyze"),
      time_range: z.enum(['last_7_days', 'last_30_days', 'last_90_days']).default('last_30_days').describe("Time range for analysis")
    },
    async ({ user_identifier, time_range }) => {
      const { description } = formatDateRange(time_range);
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Analyze the journey for user "${user_identifier}" over the ${description}.

Steps:
1. First, use search_user to find the user's Amplitude ID
2. Then use get_user_activity to retrieve their event history
3. Identify key patterns:
   - Most frequent events
   - Session patterns
   - Any conversion events
   - Drop-off points
4. Provide insights and recommendations`
          }
        }]
      };
    }
  );

  // Prompt: Engagement report
  server.prompt(
    "engagement_report",
    "Generate a comprehensive engagement report for key events",
    {
      event_type: z.string().optional().describe("Specific event to analyze (leave empty for all active events)"),
      time_range: z.enum(['last_7_days', 'last_30_days', 'last_90_days']).default('last_30_days').describe("Time range")
    },
    async ({ event_type, time_range }) => {
      const { start, end, description } = formatDateRange(time_range);
      const eventName = event_type || '_active';
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Generate an engagement report for ${event_type ? `"${event_type}"` : 'all active events'} over the ${description}.

Steps:
1. Query event data using query_events with:
   - events: [{ eventType: "${eventName}" }]
   - start: "${start}"
   - end: "${end}"
   - interval: "day"

2. Also get real-time data using get_realtime_users

3. Analyze and report:
   - Total event count and trend
   - Daily/weekly patterns
   - Peak usage times
   - Comparison to previous period
   - Key insights and recommendations`
          }
        }]
      };
    }
  );

}

// Interface for project-specific prompts loaded from JSON
interface ProjectPrompt {
  name: string;
  description: string;
  template: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

// Load project-specific prompts from a directory
export async function loadProjectPrompts(server: McpServer, projectDir: string): Promise<void> {
  const promptsDir = resolve(projectDir, 'prompts');

  if (!existsSync(promptsDir)) {
    return;
  }

  try {
    const files = await readdir(promptsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(promptsDir, file), 'utf-8');
        const prompt: ProjectPrompt = JSON.parse(content);

        // Build schema from arguments
        const schemaObj: Record<string, z.ZodTypeAny> = {};
        if (prompt.arguments) {
          for (const arg of prompt.arguments) {
            schemaObj[arg.name] = arg.required
              ? z.string().describe(arg.description)
              : z.string().optional().describe(arg.description);
          }
        }

        server.prompt(
          prompt.name,
          prompt.description,
          schemaObj,
          async (args) => {
            // Replace placeholders in template with argument values
            let text = prompt.template;
            for (const [key, value] of Object.entries(args)) {
              text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''));
            }
            return {
              messages: [{
                role: "user",
                content: { type: "text", text }
              }]
            };
          }
        );
      } catch (err) {
        console.error(`Failed to load prompt from ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`Failed to read prompts directory:`, err);
  }
}
