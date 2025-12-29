# Amplitude MCP Server

A Model Context Protocol (MCP) server for Amplitude Analytics API, providing tools, resources, and prompts for querying event data, analyzing funnels, retention, and user behavior.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with the Amplitude Dashboard REST API, allowing them to:

- Query event data with filters and segmentation
- Analyze conversion funnels
- Track user retention
- Use pre-built prompts for common analytics tasks

## Installation

```json
{
  "mcpServers": {
    "amplitude": {
      "command": "npx",
      "args": [
        "-y",
        "amplitude-mcp",
        "--amplitude-api-key=YOUR_API_KEY",
        "--amplitude-secret-key=YOUR_SECRET_KEY"
      ]
    }
  }
}
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--amplitude-api-key` | Amplitude API key (required) |
| `--amplitude-secret-key` | Amplitude secret key (required) |
| `--amplitude-region` | Data region: `us` or `eu` (default: `us`) |
| `--project-dir` | Path to project-specific prompts directory |

## Available Tools

### Discovery Tools (Use First!)

#### list_events
**List all event types tracked in Amplitude.** Use this first to discover available events before querying. Returns event names, descriptions, and categories.

#### list_event_properties
List properties available for a specific event type. Use this to understand what filters and breakdowns are available.

#### list_user_properties
List all user properties tracked in Amplitude. Useful for understanding available segmentation options.

### Query Tools

#### query_events
Query Amplitude event counts over a date range.

#### segment_events
Query events with advanced segmentation and breakdowns by properties.

#### analyze_funnel
Analyze conversion through a sequence of events (funnel). Shows how users progress through steps and where they drop off.

**Parameters:**
- `events`: Ordered sequence of events in the funnel (2-10 events)
- `start`, `end`: Date range in YYYYMMDD format
- `mode`: `this order`, `any order`, or `exact order`
- `segment`: Optional user segment filter
- `groupBy`: Optional property to group results by

#### analyze_retention
Analyze user retention between a starting event and return event.

**Parameters:**
- `startEvent`: Event that starts retention window
- `returnEvent`: Event that indicates user returned
- `start`, `end`: Date range
- `retentionType`: `bracket` or `rolling`

## Available Prompts

The server includes built-in prompts for common analytics tasks:

| Prompt | Description |
|--------|-------------|
| `conversion_funnel` | Analyze conversion rates through a sequence of events |
| `engagement_report` | Generate a comprehensive engagement report |
| `retention_analysis` | Analyze user retention between events |

## Available Resources

### amplitude_events
Access event data with resource listing capability.

**URI Format:** `amplitude://events/{eventType}/{start}/{end}`

## Project-Specific Prompts

You can add project-specific prompts by creating a `projects/` directory with JSON prompt files:

```
projects/
└── my-project/
    └── prompts/
        └── custom-funnel.json
```

Load with: `--project-dir=./projects/my-project`

### Prompt JSON Format

```json
{
  "name": "my_custom_prompt",
  "description": "Description for the prompt",
  "template": "The prompt template with {placeholder} values",
  "arguments": [
    {
      "name": "placeholder",
      "description": "Description of the argument",
      "required": true
    }
  ]
}
```

## Development

### Project Structure

```
amplitude-mcp/
├── src/
│   ├── index.ts              # Server setup
│   ├── tools/                # Tool implementations
│   │   ├── taxonomy.ts       # Event discovery (list_events, etc.)
│   │   ├── event-segmentation.ts
│   │   ├── funnel-analysis.ts
│   │   └── retention.ts
│   ├── prompts/              # Generic prompts
│   ├── resources/            # Resource handlers
│   ├── services/             # Amplitude API service
│   └── types/                # TypeScript types
├── projects/                 # Project-specific (gitignored)
├── bin/cli.js
└── package.json
```

### Building

```bash
npm run build
```

### Testing with Inspector

```bash
npm run inspect
```

## License

MIT
