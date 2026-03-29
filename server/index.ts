import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { google } from 'googleapis'
import {z} from 'zod'

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json())
app.use(cors({ origin: '*' }))

// Create MCP server
const mcpServer = new McpServer({ name: 'gmail-worker', version: '1.0.0' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.REDIRECT_URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

app.get('/api/auth/callback/google', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('No code found in the callback.');
  }

  try {
    // Exchange the 'code' for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Log this! This is the Refresh Token you need for your .env
    console.log('✅ Successfully authorized!');
    console.log('Refresh Token:', tokens.refresh_token);

    // Give the user a visual confirmation in the browser
    res.send('<h1>Authentication Successful!</h1><p>You can close this tab and check your terminal for the Refresh Token.</p>');
  } catch (error) {
    console.error('❌ Error exchanging code:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Tool: Search Emails
mcpServer.tool("search_emails", { query: z.string() }, async ({ query }) => {
  console.log(`1 : Tool call started with query : ${query}`)
  try {
    // Notice we use the pre-configured 'gmail' instance here
    const res = await gmail.users.messages.list({ 
      userId: "me", 
      q: query, 
      maxResults: 5 
    });
    console.log("2 : Yay gmail client ready!!")
    console.log(res.data)
    if (!res.data.messages) {
      console.log("No emails found")
       return { content: [{ type: "text", text: "No emails found" }] };
    }

    const snippets = await Promise.all(res.data.messages.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
      return `ID: ${m.id} - ${msg.data.snippet}`;
    }));
    console.log("3 : API response recieved!!")
    return snippets.join("\n\n");

  } catch (error) {
    console.log("ERROR MAN : ", error)
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
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
