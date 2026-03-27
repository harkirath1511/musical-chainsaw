import { useEffect, useState } from 'react';


export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Sending message:', inputValue);
    
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      console.log('✅ Received response:', fullText);
      const agentMessage = { id: Date.now() + 1, role: 'assistant', content: fullText };
      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      console.error('Chat Error:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md p-4">
        <h1 className="text-2xl font-bold text-center">NOTHNg</h1>
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
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., Find my latest Amazon receipts"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Send'}
          </button>
        </form>
      </footer>
      {error && <div className="fixed bottom-20 left-4 bg-red-600 p-4 rounded text-white">{error.message}</div>}
    </div>
  );
}