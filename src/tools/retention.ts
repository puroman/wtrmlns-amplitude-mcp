import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { amplitudeService } from "../services/amplitude.service.js";
import { getAmplitudeCredentials } from "../utils/config.js";
import { dateRangeSchema, segmentSchema, propertyFilterSchema } from "../types/schemas.js";
import { RetentionParams, PropertyFilter } from "../types/amplitude.js";

export function registerRetentionTool(server: McpServer): void {
  server.tool("analyze_retention",
    "Analyze user retention between a starting event and return event. Shows what percentage of users come back over time.",
    {
      startEvent: z.object({
        eventType: z.string().describe("Event that starts the retention window (e.g., 'sign_up', 'first_purchase')"),
        filters: z.array(propertyFilterSchema).optional().describe("Optional filters on the start event")
      }).describe("The starting event for retention analysis"),
      returnEvent: z.object({
        eventType: z.string().describe("Event that indicates user returned (e.g., 'page_viewed', 'purchase')"),
        filters: z.array(propertyFilterSchema).optional().describe("Optional filters on the return event")
      }).describe("The return event for retention analysis"),
      ...dateRangeSchema,
      retentionType: z.enum(['bracket', 'rolling']).default('bracket').describe("'bracket' = specific day ranges, 'rolling' = cumulative retention"),
      segment: segmentSchema.optional().describe("Filter to a specific user segment"),
      groupBy: z.string().optional().describe("Property to group results by")
    },
    async ({ startEvent, returnEvent, start, end, retentionType, segment, groupBy }) => {
      try {
        const credentials = getAmplitudeCredentials();

        const params: RetentionParams = {
          startEvent: {
            eventType: startEvent.eventType,
            filters: startEvent.filters as PropertyFilter[] | undefined
          },
          returnEvent: {
            eventType: returnEvent.eventType,
            filters: returnEvent.filters as PropertyFilter[] | undefined
          },
          start,
          end,
          retentionType,
          segment: segment as Array<{ prop: string; op: string; values: string[] }> | undefined,
          groupBy
        };

        const result = await amplitudeService.analyzeRetention(credentials, params);

        return {
          content: [
            { type: "text", text: "Retention Analysis Results:" },
            { type: "text", text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error analyzing retention: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );
}
