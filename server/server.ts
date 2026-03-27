import express from 'express'
import cors from 'cors'
import type {Request, Response} from 'express'
import { streamText } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv'

const PORT = 8000;
const app = express();
dotenv.config();
app.use(express.json())
app.use(cors({
    origin : '*'
}))

// Create MCP client ONCE and reuse it
let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
let mcpTools: Record<string, any> | null = null;

async function getMCPClient() {
    if (!mcpClient) {
        console.log('🔗 Creating MCP client (one-time)...');
        mcpClient = await createMCPClient({
            transport: { type: 'http', url: "http://localhost:3000/mcp" }
        });
        mcpTools = await mcpClient.tools();
        console.log('✅ MCP client ready, tools:', Object.keys(mcpTools));
    }
    return { client: mcpClient, tools: mcpTools! };
}

app.get('/', (req : Request, res : Response)=>{
    res.send("Hiiii!!!")
});

app.post('/api/chat', async(req, res)=>{
    const {messages} = req.body;
    console.log('📨 Chat request:', messages.length, 'messages');

    try {
        const { tools } = await getMCPClient();

        const result = await streamText({
            model: google("gemini-flash-lite-latest"),  // Cheaper model
            messages,
            tools,
            maxRetries: 1 // Don't auto-retry on failure
        });
        console.log("res : : ", res)
        result.pipeTextStreamToResponse(res);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
})

app.listen(PORT, ()=>{
    console.log(`Hello, main server's running on port : ${PORT}`);
})
