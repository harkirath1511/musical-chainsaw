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

        const result = streamText({
            model: google("gemini-flash-lite-latest"),
            system : ` You are a helpful assistant with access to the user's Gmail. 
                    When the user asks to search for emails, you MUST follow these Gmail Search Operator rules:
                    1. Dates: Use 'newer_than:2d' or 'older_than:1m' instead of "last 2 days".
                    2. Specific Dates: Use YYYY/MM/DD format (e.g., 'after:2026/03/01').
                    3. Senders: Use 'from:name' or 'from:email@domain.com'.
                    4. Important status: Use 'is:unread', 'is:starred', or 'is:important'.
                    5. Categories: Use 'category:primary', 'category:social', or 'category:promotions'.
            Example: If a user says "Find Ollama emails from yesterday", 
            generate the query: "from:Ollama newer_than:1d" 
            IMPORTANT : After using a tool, always summarize the results for the user in a natural way. If you found emails, list the key points. If you found nothing, explain why.`,
            messages,
            tools,
            maxRetries: 1,
            maxSteps: 5,
            onStepFinish: (step) => {
                console.log('🏁 Step finished. Tool calls made:', step.toolCalls.length);
            }
        });
        

        await result.pipeTextStreamToResponse(res);
        
        console.log('✅ Response streamed successfully');

        // // Stream to response and collect for logging
        // let fullText = '';
        // for await (const textPart of result.textStream) {
        //     console.log("Streamed part:", textPart);
        //     fullText += textPart;
        //     res.write(textPart);
        // }
        // res.end();

        // console.log('✅ Response sent:', fullText.substring(0, 100) + '...');
    } catch (error) {
        console.error('❌ Chat error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
})

// // Test endpoint WITHOUT tools
// app.post('/api/test', async (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Content-Type', 'text/plain; charset=utf-8');

//     try {
//         const result = streamText({
//             model: google("gemini-flash-lite-latest"),
//             messages: [{ role: 'user', content: 'Say hello' }],
//         });
//         await result.pipeTextStreamToResponse(res);
//     } catch (error) {
//         console.error('❌ Test error:', error);
//         if (!res.headersSent) {
//             res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
//         }
//     }
// });

app.listen(PORT, ()=>{
    console.log(`Hello, main server's running on port : ${PORT}`);
})
