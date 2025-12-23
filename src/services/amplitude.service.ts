import fetch from 'node-fetch';
import {
  AmplitudeCredentials,
  EventSegmentationParams,
  EventSegmentationResponse
} from '../types/amplitude.js';

export class AmplitudeService {
  /**
   * Get the base URL for Amplitude API based on region
   * @param region Region ('us' or 'eu')
   * @returns Base URL string
   */
  private getBaseUrl(region?: 'us' | 'eu'): string {
    // Amplitude Dashboard REST API base URLs per documentation
    // Standard server: https://amplitude.com/api/2/
    // EU residency server: https://analytics.eu.amplitude.com/api/2/
    if (region === 'eu') {
      return 'https://analytics.eu.amplitude.com/api/2';
    }
    return 'https://amplitude.com/api/2';
  }
  
  /**
   * Query events using the Event Segmentation API
   * @param credentials Amplitude API credentials
   * @param params Event segmentation parameters
   * @returns Event segmentation data
   */
  async queryEvents(
    credentials: AmplitudeCredentials,
    params: EventSegmentationParams
  ): Promise<EventSegmentationResponse> {
    const baseUrl = this.getBaseUrl(credentials.region);
    // Amplitude Dashboard REST API uses GET with query parameters
    // Event Segmentation endpoint: /events/segmentation
    const url = new URL(`${baseUrl}/events/segmentation`);
    
    // Build event object according to Dashboard REST API format
    // The 'e' parameter is a JSON string representing the event
    interface DashboardEvent {
      event_type: string;
      filters?: Array<{
        subprop_type: string;
        subprop_key: string;
        subprop_op: string;
        subprop_value: Array<string | number | boolean>;
      }>;
      group_by?: Array<{
        type: string;
        value: string;
      }>;
    }
    
    const eventObj: DashboardEvent = {
      event_type: params.events[0].eventType,
    };
    
    // Add filters if present (convert to Dashboard API format)
    if (params.events[0].propertyFilters && params.events[0].propertyFilters.length > 0) {
      eventObj.filters = params.events[0].propertyFilters.map((filter) => ({
        subprop_type: 'event', // Default to event property, could be enhanced
        subprop_key: filter.propertyName,
        subprop_op: filter.op,
        subprop_value: Array.isArray(filter.value) ? filter.value : [filter.value],
      }));
    }
    
    // Add group_by if present (only for valid event/user properties, not "eventType")
    // Note: "eventType" is not a valid property for group_by - it's used to discover events
    // If groupBy is "eventType", we should query without group_by to get all events
    if (params.groupBy && params.groupBy !== 'eventType') {
      eventObj.group_by = [{
        type: 'event', // Default to event property, could be enhanced to detect user properties
        value: params.groupBy,
      }];
    }
    
    // Set query parameters according to Dashboard REST API format
    url.searchParams.set('e', JSON.stringify(eventObj));
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);
    
    // Interval parameter: numeric value (1 = daily, 7 = weekly, 30 = monthly)
    if (params.interval) {
      const intervalMap: Record<string, string> = {
        'day': '1',
        'week': '7',
        'month': '30'
      };
      const intervalValue = intervalMap[params.interval] || params.interval;
      url.searchParams.set('i', intervalValue);
    }
    
    const headers = this.buildHeaders(credentials);
    
    try {
      // Dashboard REST API uses GET requests with query parameters
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          // Read error response body
          const errorText = await response.text();
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              // Extract error message from various possible fields
              const error = errorData.error || errorData.message || errorData.code;
              errorMessage = typeof error === 'string' 
                ? `Amplitude API error: ${error}` 
                : `Amplitude API error: ${errorText}`;
            } catch {
              // Not JSON, use text as-is
              errorMessage = `Amplitude API error: ${errorText}`;
            }
          }
        } catch {
          // If reading response fails, use status text
          errorMessage = `Amplitude API error: HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json() as EventSegmentationResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to query events: ${String(error)}`);
    }
  }

  /**
   * Build headers for Amplitude API requests
   * @param credentials Amplitude API credentials
   * @returns Headers object
   */
  private buildHeaders(credentials: AmplitudeCredentials): Record<string, string> {
    // Amplitude Dashboard REST API uses Basic Auth per documentation:
    // Pass base64-encoded credentials in the request header as {api-key}:{secret-key}
    // api-key replaces username, secret-key replaces password
    const authString = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
    
    return {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    };
  }
}

export const amplitudeService = new AmplitudeService();