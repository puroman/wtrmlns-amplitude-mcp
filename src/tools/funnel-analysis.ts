import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { amplitudeService } from "../services/amplitude.service.js";
import { getAmplitudeCredentials } from "../utils/config.js";
import { eventWithFiltersSchema, dateRangeSchema, segmentSchema } from "../types/schemas.js";
import { FunnelParams, PropertyFilter } from "../types/amplitude.js";

export function registerFunnelAnalysisTool(server: McpServer): void {
  server.tool("analyze_funnel",
    "Analyze conversion through a sequence of events (funnel). Shows how users progress through steps and where they drop off.",
    {
      events: z.array(eventWithFiltersSchema).min(2).max(10).describe("Ordered sequence of events in the funnel (2-10 events)"),
      ...dateRangeSchema,
      mode: z.enum(['this order', 'any order', 'exact order']).default('this order').describe("Funnel mode: 'this order' (sequential), 'any order', or 'exact order' (no other events between)"),
      conversionWindow: z.number().optional().describe("Max seconds between first and last event for conversion (default: no limit)"),
      segment: segmentSchema.optional().describe("Filter to a specific user segment"),
      groupBy: z.string().optional().describe("Property to group results by (e.g., 'platform', 'gp:country')")
    },
    async ({ events, start, end, mode, conversionWindow, segment, groupBy }) => {
      try {
        const credentials = getAmplitudeCredentials();
        
        const params: FunnelParams = {
          events: events.map(e => ({
            eventType: e.eventType,
            propertyFilters: e.propertyFilters as PropertyFilter[] | undefined
          })),
          start,
          end,
          mode,
          conversionWindow,
          segment: segment as Array<{ prop: string; op: string; values: string[] }> | undefined,
          groupBy
        };

        const result = await amplitudeService.analyzeFunnel(credentials, params);

        // Calculate conversion rates for summary
        const data = result.data;
        let summary = 'Funnel Analysis Results:\n';
        
        if (data?.series && Array.isArray(data.series)) {
          const steps = data.series;
          for (let i = 0; i < steps.length; i++) {
            const stepValue = steps[i];
            const prevValue = i > 0 ? steps[i - 1] : stepValue;
            const overallRate = steps[0] > 0 ? ((stepValue / steps[0]) * 100).toFixed(1) : '0';
            const stepRate = prevValue > 0 ? ((stepValue / prevValue) * 100).toFixed(1) : '0';
            summary += `Step ${i + 1}: ${stepValue} users (${overallRate}% overall, ${stepRate}% from prev)\n`;
          }
        }

        return {
          content: [
            { type: "text", text: summary },
            { type: "text", text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error analyzing funnel: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );
}
