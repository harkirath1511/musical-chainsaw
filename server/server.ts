import express from 'express'
import cors from 'cors'
import type {Request, Response} from 'express'
import { streamText } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { google } from '@ai-sdk/google';


const PORT = 8000;
const app = express();

app.use(express.json())
app.use(cors({
    origin : '*'
}))

app.get('/', (req : Request, res : Response)=>{
    res.send("Hiiii!!!")
});

app.post('/api/chat', async(req, res)=>{
    const {messages} = req.body;

    const mcpClient = await createMCPClient({
        transport : {type : 'sse', url: "http://localhost:3000/sse"}
    })

    const result = await streamText({
        model : "google/gemini-2.0-flash",
        messages,
        tools : await mcpClient.tools(),
        onFinish : ()=> mcpClient.close()
    })

    result.pipeTextStreamToResponse(res);
})  


app.listen(PORT, ()=>{
    console.log(`Hello, main server's running on port : ${PORT}`);
})