import { z } from "zod";

// Shared value schema for property filters
export const propertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
]);

// Property filter schema used across multiple tools
export const propertyFilterSchema = z.object({
  propertyName: z.string().describe("Name of the event property to filter on"),
  value: propertyValueSchema.describe("Value to match"),
  op: z.enum(['is', 'is not', 'contains', 'does not contain', '>', '<', '>=', '<=']).describe("Comparison operator")
});

// Basic event schema
export const eventSchema = z.object({
  eventType: z.string().min(1).describe("Event name to query (e.g., 'page_viewed', 'button_clicked')")
});

// Event schema with optional filters
export const eventWithFiltersSchema = z.object({
  eventType: z.string().min(1).describe("Event name to query"),
  propertyFilters: z.array(propertyFilterSchema).optional().describe("Optional filters on event properties")
});

// Breakdown schema for segmentation
export const breakdownSchema = z.object({
  type: z.enum(['event', 'user']).describe("'event' for event properties, 'user' for user properties"),
  propertyName: z.string().describe("Actual property name like 'platform', 'country', 'device_type'")
});

// Date range schema
export const dateRangeSchema = {
  start: z.string().regex(/^\d{8}/).describe("Start date in YYYYMMDD format"),
  end: z.string().regex(/^\d{8}/).describe("End date in YYYYMMDD format")
};

// Interval schema
export const intervalSchema = z.enum(['day', 'week', 'month']).default('day').describe("Time interval for grouping");

// Segment condition schema for user filtering
export const segmentConditionSchema = z.object({
  prop: z.string().describe("Property name (use 'gp:name' for custom user properties)"),
  op: z.enum(['is', 'is not', 'contains', 'does not contain', 'less', 'less or equal', 'greater', 'greater or equal', 'set is', 'set is not']).describe("Comparison operator"),
  values: z.array(z.string()).describe("Values to match")
});

// Segment schema
export const segmentSchema = z.array(segmentConditionSchema).describe("Array of filter conditions for the segment");

// Type exports
export type PropertyFilter = z.infer<typeof propertyFilterSchema>;
export type EventWithFilters = z.infer<typeof eventWithFiltersSchema>;
export type Breakdown = z.infer<typeof breakdownSchema>;
export type SegmentCondition = z.infer<typeof segmentConditionSchema>;
