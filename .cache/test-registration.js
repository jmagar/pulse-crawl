#!/usr/bin/env node

// Test script to verify MCP server registration
import { createMCPServer } from '../shared/dist/server.js';

async function testRegistration() {
  console.log('Creating MCP server...');
  const { server, registerHandlers } = createMCPServer();

  console.log('Server created:', {
    name: server.serverInfo?.name,
    version: server.serverInfo?.version,
    capabilities: server.serverInfo?.capabilities
  });

  console.log('\nRegistering handlers...');
  await registerHandlers(server);

  console.log('Handlers registered successfully!');

  // Try to list tools by simulating a request
  console.log('\nTesting tool listing...');
  try {
    // Access the internal request handlers map
    const handlers = server._requestHandlers || server.requestHandlers;
    console.log('Request handlers registered:', handlers ? Object.keys(handlers).length : 'unknown');

    // Try to get the list of tools
    const toolsHandler = handlers?.get?.('tools/list');
    if (toolsHandler) {
      console.log('tools/list handler found!');
      const result = await toolsHandler({});
      console.log('Tools:', result.tools?.map(t => t.name) || 'none');
    } else {
      console.log('ERROR: No tools/list handler registered!');
    }

    // Try to get the list of resources
    const resourcesHandler = handlers?.get?.('resources/list');
    if (resourcesHandler) {
      console.log('\nresources/list handler found!');
      const result = await resourcesHandler({});
      console.log('Resources:', result.resources?.length || 0);
    } else {
      console.log('ERROR: No resources/list handler registered!');
    }
  } catch (error) {
    console.error('Error during testing:', error.message);
    console.error(error.stack);
  }
}

testRegistration().catch(console.error);
