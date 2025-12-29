/**
 * Types for Amplitude Dashboard REST API
 */

export interface AmplitudeCredentials {
  apiKey: string;
  secretKey: string;
  region?: 'us' | 'eu';
}

export interface BaseAmplitudeParams {
  start: string;
  end: string;
}

// Property filter used across multiple endpoints
export interface PropertyFilter {
  propertyName: string;
  value: string | number | boolean | Array<string | number | boolean>;
  op: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

// Event Segmentation types
export interface EventSegmentationEvent {
  eventType: string;
  propertyFilters?: PropertyFilter[];
}

export interface EventSegmentationBreakdown {
  type: 'event' | 'user';
  propertyName: string;
}

export interface EventSegmentationFilter {
  type: 'property' | 'event' | 'user';
  propertyName?: string;
  value?: string | number | boolean | Array<string | number | boolean>;
  op?: 'is' | 'is not' | 'contains' | 'does not contain' | '>' | '<' | '>=' | '<=';
}

export interface EventSegmentationParams extends BaseAmplitudeParams {
  events: EventSegmentationEvent[];
  interval?: string;
  groupBy?: string;
  filters?: EventSegmentationFilter[];
  breakdowns?: EventSegmentationBreakdown[];
}

export interface EventSegmentationResponse {
  data: {
    series: Array<{ eventType: string; data: Array<number> }>;
    seriesLabels: Array<string>;
    xValues: Array<string>;
  };
  metadata: { start: string; end: string; interval: string };
}

// Funnel types
export interface FunnelParams extends BaseAmplitudeParams {
  events: Array<{ eventType: string; propertyFilters?: PropertyFilter[] }>;
  mode?: 'this order' | 'any order' | 'exact order';
  conversionWindow?: number;
  segment?: Array<{ prop: string; op: string; values: string[] }>;
  groupBy?: string;
}

export interface FunnelResponse {
  data: {
    series: number[];
    seriesLabels: string[];
    formattedSeries?: Array<{ value: number; percentage: number }>;
  };
  metadata: { start: string; end: string };
}

// Retention types
export interface RetentionParams extends BaseAmplitudeParams {
  startEvent: { eventType: string; filters?: PropertyFilter[] };
  returnEvent: { eventType: string; filters?: PropertyFilter[] };
  retentionType?: 'bracket' | 'rolling';
  segment?: Array<{ prop: string; op: string; values: string[] }>;
  groupBy?: string;
}

export interface RetentionResponse {
  data: {
    series: Array<Array<number>>;
    seriesLabels: Array<string>;
    retentionByDay?: Record<string, number>;
  };
  metadata: { start: string; end: string };
}

// Error response
export interface AmplitudeErrorResponse {
  error: string;
  code?: number;
  message?: string;
}

// Taxonomy API types
export interface EventInfo {
  id: number;
  value: string;        // The actual event_type to use in queries
  display?: string;     // Display name
  name?: string;        // Event name
  category?: string;
  description?: string;
  hidden?: boolean;
  deleted?: boolean;
  non_active?: boolean;
  totals?: number;
}

export interface EventListResponse {
  data: EventInfo[];
}

export interface PropertyInfo {
  id?: number;
  name?: string;              // Property name
  property_name?: string;     // Alternative field
  type?: string;              // Data type
  property_type?: string;     // Alternative field
  description?: string;
  is_array_type?: boolean;
  is_enum?: boolean;
  enum_values?: string[];
  regex?: string;
}

export interface EventPropertiesResponse {
  success: boolean;
  data: PropertyInfo[];
}

export interface UserPropertiesResponse {
  success: boolean;
  data: PropertyInfo[];
}
