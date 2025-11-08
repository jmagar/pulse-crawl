#!/usr/bin/env node

// Test script to inspect tool schemas
import { createSearchTool } from '../shared/dist/mcp/tools/search/index.js';
import { createMapTool } from '../shared/dist/mcp/tools/map/index.js';
import { createCrawlTool } from '../shared/dist/mcp/tools/crawl/index.js';

const firecrawlConfig = {
  apiKey: process.env.FIRECRAWL_API_KEY || 'test-key',
  baseUrl: process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev',
};

console.log('Testing tool schemas...\n');

console.log('=== SEARCH TOOL ===');
try {
  const searchTool = createSearchTool(firecrawlConfig);
  console.log('Name:', searchTool.name);
  console.log('Description length:', searchTool.description?.length || 0);
  console.log('Input Schema:', JSON.stringify(searchTool.inputSchema, null, 2).substring(0, 500));
  console.log('Schema type:', searchTool.inputSchema?.type);
  console.log('Schema has properties:', !!searchTool.inputSchema?.properties);
} catch (error) {
  console.error('ERROR:', error.message);
}

console.log('\n=== MAP TOOL ===');
try {
  const mapTool = createMapTool(firecrawlConfig);
  console.log('Name:', mapTool.name);
  console.log('Description length:', mapTool.description?.length || 0);
  console.log('Input Schema:', JSON.stringify(mapTool.inputSchema, null, 2).substring(0, 500));
  console.log('Schema type:', mapTool.inputSchema?.type);
  console.log('Schema has properties:', !!mapTool.inputSchema?.properties);
} catch (error) {
  console.error('ERROR:', error.message);
}

console.log('\n=== CRAWL TOOL ===');
try {
  const crawlTool = createCrawlTool(firecrawlConfig);
  console.log('Name:', crawlTool.name);
  console.log('Description length:', crawlTool.description?.length || 0);
  console.log('Input Schema:', JSON.stringify(crawlTool.inputSchema, null, 2).substring(0, 500));
  console.log('Schema type:', crawlTool.inputSchema?.type);
  console.log('Schema has properties:', !!crawlTool.inputSchema?.properties);
} catch (error) {
  console.error('ERROR:', error.message);
}
