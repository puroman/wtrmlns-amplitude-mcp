/**
 * Types for Amplitude API
 */

/**
 * Amplitude API credentials
 */
export interface AmplitudeCredentials {
  apiKey: string;
  secretKey: string;
  region?: 'us' | 'eu';
}

/**
 * Base parameters for all Amplitude API requests
 */
export interface BaseAmplitudeParams {
  start: string;  // ISO date string
  end: string;    // ISO date string
}

/**
 * Event Segmentation API request parameters
 */
export interface EventSegmentationParams extends BaseAmplitudeParams {
  events: EventSegmentationEvent[];
  interval?: string;  // Optional: day, week, month
  groupBy?: string;   // Optional: grouping dimension
  filters?: EventSegmentationFilter[];
  breakdowns?: EventSegmentationBreakdown[];
}

/**
 * Event definition for segmentation
 */
export interface EventSegmentationEvent {
  eventType: string;
  propertyFilters?: PropertyFilter[];
}

/**
 * Filter for event segmentation
 */
export interface EventSegmentationFilter {
  type: 'property' | 'event' | 'user';
  propertyName?: string;
  value?: string | number | boolean | Array<string | number | boolean>;
  op?: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

/**
 * Breakdown for event segmentation
 */
export interface EventSegmentationBreakdown {
  type: 'event' | 'user';
  propertyName: string;
}

/**
 * Property filter
 */
export interface PropertyFilter {
  propertyName: string;
  value: string | number | boolean | Array<string | number | boolean>;
  op: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

/**
 * Event Segmentation API response
 */
export interface EventSegmentationResponse {
  data: {
    series: Array<{
      eventType: string;
      data: Array<number>;
    }>;
    seriesLabels: Array<string>;
    xValues: Array<string>;
  };
  metadata: {
    start: string;
    end: string;
    interval: string;
  };
}

/**
 * Error response from Amplitude API
 */
export interface AmplitudeErrorResponse {
  error: string;
  code?: number;
  message?: string;
}