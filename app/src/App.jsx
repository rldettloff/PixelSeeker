import { useState } from 'react';
import './App.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';

const API_KEY = import.meta.env.VITE_API_KEY;
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const systemMessage = {
  role: 'system',
  content:
    "You are PixelSeeker, an expert in video games. Help users find games based on their preferences, recommend trending titles, and answer any gaming-related questions. Respond in an engaging and knowledgeable manner.",
};

function App() {
  const [messages, setMessages] = useState([
    {
      message:
        'Welcome to PixelSeeker! Ask me for game recommendations by genre, style, or keywords like "first-person shooters" or "RPGs".',
      direction: 'incoming',
      sentTime: 'just now',
      sender: 'PixelSeeker',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: 'user',
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);
    await processMessage(newMessages);
  };

  async function fetchRAWGGamesByKeyword(keyword) {
    try {
      // Use RAWG's `tags` or `genres` parameter to filter games by keyword
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&tags=${encodeURIComponent(
          keyword
        )}&page_size=5`
      );

      if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results.map((game) => ({
          name: game.name,
          released: game.released || 'Unknown',
          rating: game.rating || 'N/A',
          platforms: game.platforms
            ? game.platforms.map((p) => p.platform.name).join(', ')
            : 'Not listed',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching data from RAWG:', error);
      return [];
    }
  }

  async function processMessage(chatMessages) {
    const lastMessage = chatMessages[chatMessages.length - 1].message.toLowerCase();

    if (lastMessage.includes('recommend')) {
      // Extract the keyword from the user's query
      const keyword = lastMessage.replace('recommend', '').trim();
      const games = await fetchRAWGGamesByKeyword(keyword);

      if (games.length > 0) {
        const gameList = games
          .map(
            (game) =>
              `- **${game.name}** (Released: ${game.released}, Rating: ${game.rating}, Platforms: ${game.platforms})`
          )
          .join('\n');

        setMessages([
          ...chatMessages,
          {
            message: `Here are some recommendations based on your interest in "${keyword}":\n\n${gameList}`,
            sender: 'PixelSeeker',
            direction: 'incoming',
          },
        ]);
      } else {
        setMessages([
          ...chatMessages,
          {
            message: `I couldn't find any games matching "${keyword}". Try using a different genre or keyword.`,
            sender: 'PixelSeeker',
            direction: 'incoming',
          },
        ]);
      }
      setIsTyping(false);
      return;
    }

    // Handle other queries using OpenAI
    const apiMessages = chatMessages.map((messageObject) => {
      let role = messageObject.sender === 'PixelSeeker' ? 'assistant' : 'user';
      return { role: role, content: messageObject.message };
    });

    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...apiMessages],
    };

    await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => data.json())
      .then((data) => {
        setMessages([
          ...chatMessages,
          {
            message: data.choices[0].message.content,
            sender: 'PixelSeeker',
            direction: 'incoming',
          },
        ]);
      })
      .catch((error) => {
        console.error('Error communicating with OpenAI API:', error);
        setMessages([
          ...chatMessages,
          {
            message:
              'There was an issue processing your request. Please try again later.',
            sender: 'PixelSeeker',
            direction: 'incoming',
          },
        ]);
      })
      .finally(() => setIsTyping(false));
  }

  return (
    <div className="App">
      <div style={{ position: 'relative', height: '800px', width: '700px' }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={
                isTyping ? <TypingIndicator content="PixelSeeker is typing..." /> : null
              }
            >
              {messages.map((message, i) => (
                <Message key={i} model={message} />
              ))}
            </MessageList>
            <MessageInput
              placeholder="What game genre are you looking for?"
              onSend={handleSend}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
