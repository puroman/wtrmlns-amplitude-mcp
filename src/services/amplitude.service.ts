import fetch from 'node-fetch';
import {
  AmplitudeCredentials,
  EventSegmentationParams,
  EventSegmentationResponse,
  FunnelParams,
  FunnelResponse,
  RetentionParams,
  RetentionResponse,
  EventListResponse,
  EventPropertiesResponse,
  UserPropertiesResponse
} from '../types/amplitude.js';

export class AmplitudeService {
  private getBaseUrl(region?: 'us' | 'eu'): string {
    return region === 'eu' ? 'https://analytics.eu.amplitude.com/api/2' : 'https://amplitude.com/api/2';
  }

  private buildHeaders(credentials: AmplitudeCredentials): Record<string, string> {
    const authString = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
    return { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' };
  }

  private async handleResponse<T>(response: Awaited<ReturnType<typeof fetch>>): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            const error = errorData.error || errorData.message || errorData.code;
            errorMessage = typeof error === 'string' ? `Amplitude API error: ${error}` : `Amplitude API error: ${errorText}`;
          } catch {
            errorMessage = `Amplitude API error: ${errorText}`;
          }
        }
      } catch {
        errorMessage = `Amplitude API error: HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    return await response.json() as T;
  }

  async queryEvents(credentials: AmplitudeCredentials, params: EventSegmentationParams): Promise<EventSegmentationResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/events/segmentation`);

    interface DashboardEvent {
      event_type: string;
      filters?: Array<{ subprop_type: string; subprop_key: string; subprop_op: string; subprop_value: Array<string | number | boolean> }>;
      group_by?: Array<{ type: string; value: string }>;
    }

    const eventObj: DashboardEvent = { event_type: params.events[0].eventType };

    if (params.events[0].propertyFilters?.length) {
      eventObj.filters = params.events[0].propertyFilters.map((filter) => ({
        subprop_type: 'event',
        subprop_key: filter.propertyName,
        subprop_op: filter.op,
        subprop_value: Array.isArray(filter.value) ? filter.value : [filter.value],
      }));
    }

    if (params.breakdowns?.length) {
      eventObj.group_by = params.breakdowns.map((b) => ({ type: b.type, value: b.propertyName }));
    }

    url.searchParams.set('e', JSON.stringify(eventObj));
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);

    if (params.interval) {
      const intervalMap: Record<string, string> = { 'day': '1', 'week': '7', 'month': '30' };
      url.searchParams.set('i', intervalMap[params.interval] || params.interval);
    }

    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<EventSegmentationResponse>(response);
  }

  async analyzeFunnel(credentials: AmplitudeCredentials, params: FunnelParams): Promise<FunnelResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/funnels`);

    const events = params.events.map((event) => {
      const e: Record<string, unknown> = { event_type: event.eventType };
      if (event.propertyFilters?.length) {
        e.filters = event.propertyFilters.map((f) => ({
          subprop_type: 'event',
          subprop_key: f.propertyName,
          subprop_op: f.op,
          subprop_value: Array.isArray(f.value) ? f.value : [f.value]
        }));
      }
      return e;
    });

    events.forEach((e) => url.searchParams.append('e', JSON.stringify(e)));
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);

    if (params.mode) url.searchParams.set('mode', params.mode);
    if (params.conversionWindow) url.searchParams.set('cs', String(params.conversionWindow));
    if (params.segment) url.searchParams.append('s', JSON.stringify(params.segment));
    if (params.groupBy) url.searchParams.set('g', params.groupBy);

    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<FunnelResponse>(response);
  }

  async analyzeRetention(credentials: AmplitudeCredentials, params: RetentionParams): Promise<RetentionResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/retention`);

    const startEvent: Record<string, unknown> = { event_type: params.startEvent.eventType };
    if (params.startEvent.filters?.length) {
      startEvent.filters = params.startEvent.filters.map((f) => ({
        subprop_type: 'event',
        subprop_key: f.propertyName,
        subprop_op: f.op,
        subprop_value: Array.isArray(f.value) ? f.value : [f.value]
      }));
    }

    const returnEvent: Record<string, unknown> = { event_type: params.returnEvent.eventType };
    if (params.returnEvent.filters?.length) {
      returnEvent.filters = params.returnEvent.filters.map((f) => ({
        subprop_type: 'event',
        subprop_key: f.propertyName,
        subprop_op: f.op,
        subprop_value: Array.isArray(f.value) ? f.value : [f.value]
      }));
    }

    url.searchParams.set('se', JSON.stringify(startEvent));
    url.searchParams.set('re', JSON.stringify(returnEvent));
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);

    if (params.retentionType) url.searchParams.set('rm', params.retentionType === 'rolling' ? 'rolling' : 'bracket');
    if (params.segment) url.searchParams.append('s', JSON.stringify(params.segment));
    if (params.groupBy) url.searchParams.set('g', params.groupBy);

    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<RetentionResponse>(response);
  }

  // Taxonomy API endpoints
  async listEvents(credentials: AmplitudeCredentials): Promise<EventListResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/taxonomy/event`);
    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<EventListResponse>(response);
  }

  async getEventProperties(credentials: AmplitudeCredentials, eventType: string): Promise<EventPropertiesResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/taxonomy/event-property`);
    url.searchParams.set('event_type', eventType);
    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<EventPropertiesResponse>(response);
  }

  async listUserProperties(credentials: AmplitudeCredentials): Promise<UserPropertiesResponse> {
    const url = new URL(`${this.getBaseUrl(credentials.region)}/taxonomy/user-property`);
    const response = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders(credentials) });
    return this.handleResponse<UserPropertiesResponse>(response);
  }
}

export const amplitudeService = new AmplitudeService();
