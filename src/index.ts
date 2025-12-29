import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { amplitudeService } from "./services/amplitude.service.js";
import { eventsResourceTemplate, eventsResourceHandler } from "./resources/events.js";
import { EventSegmentationEvent, EventSegmentationBreakdown } from "./types/amplitude.js";
import { getAmplitudeCredentials } from "./utils/config.js";

// Create MCP server
export const server = new McpServer({
  name: "amplitude-mcp",
  version: "0.0.1",
  description: "MCP server for Amplitude Analytics API"
});

// Simplified value schema to avoid nested array issues with JSON Schema conversion
const propertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
]);

const propertyFilterSchema = z.object({
  propertyName: z.string().describe("Name of the event property to filter on"),
  value: propertyValueSchema.describe("Value to match"),
  op: z.enum(['is', 'is not', 'contains', 'does not contain', '>', '<', '>=', '<=']).describe("Comparison operator")
});

const eventSchema = z.object({
  eventType: z.string().min(1).describe("Event name to query (e.g., 'page_viewed', 'button_clicked')")
});

// Simple query tool - just events, dates, and interval
server.tool("query_events",
  "Query Amplitude event counts over a date range. Returns daily/weekly/monthly totals.",
  {
    events: z.array(eventSchema).min(1).describe("Events to query"),
    start: z.string().regex(/^\d{8}/).describe("Start date in YYYYMMDD format"),
    end: z.string().regex(/^\d{8}/).describe("End date in YYYYMMDD format"),
    interval: z.enum(['day', 'week', 'month']).default('day').describe("Time interval for grouping")
  },
  async ({ events, start, end, interval }) => {
    try {
      const credentials = getAmplitudeCredentials();

      const queryParams = {
        events: events as EventSegmentationEvent[],
        start,
        end,
        interval
      };

      const result = await amplitudeService.queryEvents(credentials, queryParams);

      return {
        content: [
          { type: "text", text: "Event data retrieved successfully:" },
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error querying events: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

// Event schema with optional filters for segment_events
const eventWithFiltersSchema = z.object({
  eventType: z.string().min(1).describe("Event name to query"),
  propertyFilters: z.array(propertyFilterSchema).optional().describe("Optional filters on event properties")
});

const breakdownSchema = z.object({
  type: z.enum(['event', 'user']).describe("'event' for event properties, 'user' for user properties"),
  propertyName: z.string().describe("Actual property name like 'platform', 'country', 'device_type'")
});

server.tool("segment_events",
  "Query events with advanced segmentation and breakdowns by properties.",
  {
    events: z.array(eventWithFiltersSchema).min(1).describe("Events to query"),
    start: z.string().regex(/^\d{8}/).describe("Start date in YYYYMMDD format"),
    end: z.string().regex(/^\d{8}/).describe("End date in YYYYMMDD format"),
    interval: z.enum(['day', 'week', 'month']).default('day').describe("Time interval"),
    breakdowns: z.array(breakdownSchema).optional().describe("Break down results by properties")
  },
  async ({ events, start, end, interval, breakdowns }) => {
    try {
      const credentials = getAmplitudeCredentials();

      const queryParams = {
        events: events as EventSegmentationEvent[],
        start,
        end,
        interval,
        breakdowns: breakdowns as EventSegmentationBreakdown[] | undefined
      };

      const result = await amplitudeService.queryEvents(credentials, queryParams);
      
      return {
        content: [
          { type: "text", text: "Segmented event data retrieved successfully:" },
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error segmenting events: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true
      };
    }
  }
);

server.resource(
  "amplitude_events",
  eventsResourceTemplate,
  eventsResourceHandler
);

const transport = new StdioServerTransport();
await server.connect(transport);