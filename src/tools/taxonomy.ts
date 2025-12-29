import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { amplitudeService } from "../services/amplitude.service.js";
import { getAmplitudeCredentials } from "../utils/config.js";

export function registerTaxonomyTools(server: McpServer): void {
  server.tool("list_events",
    "List all event types tracked in Amplitude. Use this FIRST to discover available events before querying. Returns event names, descriptions, and categories.",
    {},
    async () => {
      try {
        const credentials = getAmplitudeCredentials();
        const result = await amplitudeService.listEvents(credentials);

        if (!result.data?.length) {
          return {
            content: [{ type: "text", text: "No events found in this Amplitude project." }]
          };
        }

        // Build a clean list of events with their actual names
        const events = result.data
          .filter(e => !e.deleted && !e.hidden)
          .map(e => ({
            eventType: e.value || e.name,
            displayName: e.display || e.name || e.value,
            totals: e.totals
          }))
          .sort((a, b) => (b.totals || 0) - (a.totals || 0));

        let summary = `Found ${events.length} active event types (sorted by volume):\n\n`;
        for (const event of events) {
          const count = event.totals !== undefined ? ` (${event.totals} total)` : '';
          summary += `- **${event.eventType}**${event.displayName !== event.eventType ? ` - "${event.displayName}"` : ''}${count}\n`;
        }

        return {
          content: [
            { type: "text", text: summary },
            { type: "text", text: JSON.stringify(result.data, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing events: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );

  server.tool("list_event_properties",
    "List properties available for a specific event type. Use this to understand what filters and breakdowns are available.",
    {
      event_type: z.string().describe("Event type name to get properties for")
    },
    async ({ event_type }) => {
      try {
        const credentials = getAmplitudeCredentials();
        const result = await amplitudeService.getEventProperties(credentials, event_type);

        if (!result.data?.length) {
          return {
            content: [{ type: "text", text: `No properties found for event "${event_type}". Try checking if the event name is correct using list_events first.` }]
          };
        }

        let summary = `Properties for "${event_type}":\n\n`;
        for (const prop of result.data) {
          const name = prop.name || prop.property_name || 'unknown';
          const type = prop.type || prop.property_type || 'string';
          summary += `- **${name}** (${type})`;
          if (prop.is_enum && prop.enum_values?.length) {
            summary += ` - values: ${prop.enum_values.slice(0, 10).join(', ')}${prop.enum_values.length > 10 ? '...' : ''}`;
          }
          summary += '\n';
          if (prop.description) summary += `  ${prop.description}\n`;
        }

        return {
          content: [
            { type: "text", text: summary },
            { type: "text", text: JSON.stringify(result.data, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting properties: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );

  server.tool("list_user_properties",
    "List all user properties tracked in Amplitude. Useful for understanding available segmentation options.",
    {},
    async () => {
      try {
        const credentials = getAmplitudeCredentials();
        const result = await amplitudeService.listUserProperties(credentials);

        if (!result.data?.length) {
          return {
            content: [{ type: "text", text: "No user properties found." }]
          };
        }

        let summary = `Found ${result.data.length} user properties:\n\n`;
        for (const prop of result.data) {
          const name = prop.name || prop.property_name || 'unknown';
          const type = prop.type || prop.property_type || 'string';
          summary += `- **${name}** (${type})`;
          if (prop.is_enum && prop.enum_values?.length) {
            summary += ` - values: ${prop.enum_values.slice(0, 5).join(', ')}${prop.enum_values.length > 5 ? '...' : ''}`;
          }
          summary += '\n';
          if (prop.description) summary += `  ${prop.description}\n`;
        }

        return {
          content: [
            { type: "text", text: summary },
            { type: "text", text: JSON.stringify(result.data, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing user properties: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );
}
