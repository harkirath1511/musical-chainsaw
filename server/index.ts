import express from 'express'
import cors from 'cors'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport, SSEServerTransportOptions } from "@modelcontextprotocol/sdk/server/sse.js";
import {google} from 'googleapis'
import {z} from 'zod'

const PORT = 3000;
const app = express();
const server = new McpServer({name : 'gmail-worker', version : '1.0.0'});

app.use(express.json())
app.use(cors({
    origin : '*'
}))

server.tool("search_emails", {query : z.string()}, async({query})=>{
    const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // Make sure this file is in this folder
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  const gmail = google.gmail({version : 'v1', auth});
  const res = await gmail.users.messages.list({ userId: "me", q: query, maxResults: 10 });

  const snippets = await Promise.all((res.data.messages || []).map(async (m)=>{
        const msg = await gmail.users.messages.get({userId : "me", id : m.id!});
        return `ID: ${m.id} - ${msg.data.snippet}`
  }))

  return {content : [{type : "text", text : snippets.join("\n\n")}]};
})

let transport  : SSEServerTransport;

app.get('/sse', async(req, res)=>{
    transport = new SSEServerTransport('/messages', res);
    await server.connect(transport)
});

app.post('/messages', (req, res)=>{
    transport.handlePostMessage(req, res);
})


app.listen(PORT, ()=>{
    console.log(`Hello, MCP's running on port : ${PORT}`);
})