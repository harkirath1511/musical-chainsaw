import { useChat } from '@ai-sdk/react';


export default function Home() {
  // Point to your Node.js Express server
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'http://localhost:8000/api/chat',
  });

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md p-4">
        <h1 className="text-2xl font-bold text-center">Gmail AI Agent</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-lg max-w-lg ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <p><strong>{m.role === 'user' ? 'You' : 'Agent'}:</strong> {m.content}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input 
            className="flex-1 p-3 rounded-l-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input} 
            onChange={handleInputChange} 
            placeholder="e.g., Find my latest Amazon receipts" 
          />
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}