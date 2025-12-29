import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { amplitudeService } from "../services/amplitude.service.js";
import { getAmplitudeCredentials } from "../utils/config.js";

// Helper to get date strings for resource listing examples
const getDateRange = (daysAgo: number): { start: string; end: string } => {
  const end = new Date();
  const start = new Date(end.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().slice(0, 10).replace(/-/g, ''),
    end: end.toISOString().slice(0, 10).replace(/-/g, '')
  };
};

// Resource template with listing capability
export const eventsResourceTemplate = new ResourceTemplate(
  "amplitude://events/{eventType}/{start}/{end}",
  {
    list: async () => {
      const { start: last7Start, end: last7End } = getDateRange(7);
      const { start: last30Start, end: last30End } = getDateRange(30);

      // Provide example resources to help clients discover the format
      return {
        resources: [
          {
            uri: `amplitude://events/_active/${last7Start}/${last7End}`,
            name: "Active Events - Last 7 Days",
            description: "All active events from the last 7 days",
            mimeType: "application/json"
          },
          {
            uri: `amplitude://events/_all/${last7Start}/${last7End}`,
            name: "All Events - Last 7 Days",
            description: "All tracked events from the last 7 days",
            mimeType: "application/json"
          },
          {
            uri: `amplitude://events/_active/${last30Start}/${last30End}`,
            name: "Active Events - Last 30 Days",
            description: "All active events from the last 30 days",
            mimeType: "application/json"
          }
        ]
      };
    }
  }
);

// Handler for events resource
export const eventsResourceHandler = async (uri: URL, params: Record<string, string>) => {
  try {
    const { eventType, start, end } = params;

    if (!eventType || !start || !end) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/plain",
          text: "Missing required parameters. Format: amplitude://events/{eventType}/{start}/{end}"
        }]
      };
    }

    const credentials = getAmplitudeCredentials();
    const result = await amplitudeService.queryEvents(credentials, {
      events: [{ eventType }],
      start,
      end
    });

    return {
      contents: [{
        uri: uri.href,
        name: `${eventType} Events (${start} - ${end})`,
        description: `Event data for ${eventType} from ${start} to ${end}`,
        mimeType: "application/json",
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    return {
      contents: [{
        uri: uri.href,
        mimeType: "text/plain",
        text: `Error accessing event data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
};
