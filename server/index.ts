import express from 'express'
import cors from 'cors'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { google } from 'googleapis'
import { z } from 'zod'

const PORT = 3000;
const app = express();

app.use(express.json())
app.use(cors({ origin: '*' }))

// Create MCP server
const mcpServer = new McpServer({ name: 'gmail-worker', version: '1.0.0' });

// Tool: Search Emails
mcpServer.tool("search_emails", { query: z.string() }, async ({ query }) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({ userId: "me", q: query, maxResults: 5 });

  const snippets = await Promise.all((res.data.messages || []).map(async (m) => {
    const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
    return `ID: ${m.id} - ${msg.data.snippet}`;
  }));

  return { content: [{ type: "text", text: snippets.join("\n\n") }] };
});

// Streamable HTTP transport - single endpoint for all MCP communication
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });

app.post('/mcp', async (req, res) => {
  console.log('📬 MCP request:', req.body?.method || 'unknown');
  await transport.handleRequest(req, res, req.body);
});

// Connect server to transport once at startup
mcpServer.connect(transport).then(() => {
  console.log('✅ MCP server connected to transport');
});

app.listen(PORT, () => {
  console.log(`Hello, MCP's running on port : ${PORT}`);
});
