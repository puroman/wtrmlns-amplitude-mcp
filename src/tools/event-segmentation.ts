import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { amplitudeService } from "../services/amplitude.service.js";
import { EventSegmentationEvent, EventSegmentationBreakdown } from "../types/amplitude.js";
import { getAmplitudeCredentials } from "../utils/config.js";
import { eventSchema, eventWithFiltersSchema, breakdownSchema, dateRangeSchema, intervalSchema } from "../types/schemas.js";

export function registerEventSegmentationTools(server: McpServer): void {
  // Simple query tool - just events, dates, and interval
  server.tool("query_events",
    "Query Amplitude event counts over a date range. Returns daily/weekly/monthly totals.",
    {
      events: z.array(eventSchema).min(1).describe("Events to query"),
      ...dateRangeSchema,
      interval: intervalSchema
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

  // Advanced segmentation tool with filters and breakdowns
  server.tool("segment_events",
    "Query events with advanced segmentation and breakdowns by properties.",
    {
      events: z.array(eventWithFiltersSchema).min(1).describe("Events to query"),
      ...dateRangeSchema,
      interval: intervalSchema,
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
}
