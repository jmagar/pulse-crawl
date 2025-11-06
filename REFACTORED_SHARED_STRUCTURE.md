Option 1: Domain-Driven Design (Most Explicit)
shared/
├── index.ts
├── server.ts
├── types.ts
│
├── mcp/ # MCP Protocol Layer
│ ├── tools/ # MCP tool implementations
│ │ └── scrape/
│ │ ├── handler.ts
│ │ ├── schema.ts
│ │ └── index.ts
│ ├── resources/ # MCP resource implementations
│ │ └── index.ts
│ ├── registration.ts # Tool & resource registration
│ └── index.ts
│
├── scraping/ # Web Scraping Domain
│ ├── clients/ # HTTP fetching clients
│ │ ├── native/
│ │ ├── firecrawl/
│ │ └── index.ts
│ ├── strategies/ # Strategy selection & execution
│ │ ├── selector.ts
│ │ ├── learned/ # Persistent strategy config
│ │ └── index.ts
│ └── index.ts
│
├── processing/ # Content Transformation Pipeline
│ ├── cleaning/ # HTML → Markdown conversion
│ │ ├── base.ts
│ │ ├── html-to-markdown.ts
│ │ └── index.ts
│ ├── parsing/ # Format-specific parsing
│ │ ├── html.ts
│ │ ├── pdf.ts
│ │ └── index.ts
│ ├── extraction/ # LLM information extraction
│ │ ├── providers/
│ │ │ ├── anthropic.ts
│ │ │ ├── openai.ts
│ │ │ └── openai-compatible.ts
│ │ ├── factory.ts
│ │ └── index.ts
│ └── index.ts
│
├── storage/ # Data Storage & Caching
│ ├── resources/
│ │ ├── backends/
│ │ │ ├── memory.ts
│ │ │ ├── filesystem.ts
│ │ │ └── index.ts
│ │ ├── factory.ts
│ │ └── types.ts
│ └── index.ts
│
├── config/ # App Configuration
│ ├── crawl-config.ts
│ ├── health-checks.ts
│ ├── validation-schemas.ts
│ └── index.ts
│
├── utils/ # Cross-cutting Utilities
│ ├── errors.ts
│ ├── logging.ts
│ ├── responses.ts
│ └── index.ts
│
└── [config files]
