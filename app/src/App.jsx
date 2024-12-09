// Import necessary modules and styles
import { useState } from 'react'; // React hook to manage state
import './App.css'; // Import application-specific styles
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'; // Chat UI kit default styles
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react'; // Components for chat UI

// Load API keys from environment variables
const API_KEY = import.meta.env.VITE_API_KEY; // OpenAI API key
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY; // RAWG API key for game data

// Define the system message to set the assistant's personality and purpose
const systemMessage = {
  role: 'system',
  content:
    "You are PixelSeeker, an expert in video games. Help users find games based on their preferences, recommend trending titles, and answer any gaming-related questions. Respond in an engaging and knowledgeable manner.",
};

function App() {
  // State to manage chat messages
  const [messages, setMessages] = useState([
    {
      message:
        'Welcome to PixelSeeker! Ask me for game recommendations by genre, style, or keywords like "first-person shooters" or "RPGs".',
      direction: 'incoming', // Message direction: 'incoming' or 'outgoing'
      sentTime: 'just now', // When the message was sent
      sender: 'PixelSeeker', // Sender of the message
    },
  ]);

  // State to show if PixelSeeker is typing
  const [isTyping, setIsTyping] = useState(false);

  // Function to handle user sending a message
  const handleSend = async (message) => {
    // Add the user's message to the chat history
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: 'user',
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);

    // Show typing indicator
    setIsTyping(true);

    // Process the user's message
    await processMessage(newMessages);
  };

  // Fetch game recommendations from RAWG API based on a keyword
  async function fetchRAWGGamesByKeyword(keyword) {
    try {
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
        // Map RAWG API results into a simplified format
        return data.results.map((game) => ({
          name: game.name,
          released: game.released || 'Unknown', // Release date
          rating: game.rating || 'N/A', // Rating
          platforms: game.platforms
            ? game.platforms.map((p) => p.platform.name).join(', ') // Platforms
            : 'Not listed',
        }));
      }
      return []; // Return empty array if no results are found
    } catch (error) {
      console.error('Error fetching data from RAWG:', error);
      return []; // Return empty array if an error occurs
    }
  }

  // Process user messages to generate a response
  async function processMessage(chatMessages) {
    const lastMessage = chatMessages[chatMessages.length - 1].message.toLowerCase();

    if (lastMessage.includes('recommend')) {
      // Extract the keyword from the user's query
      const keyword = lastMessage.replace('recommend', '').trim();

      // Fetch game recommendations
      const games = await fetchRAWGGamesByKeyword(keyword);

      if (games.length > 0) {
        // Format and display the game recommendations
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
        // No games found for the keyword
        setMessages([
          ...chatMessages,
          {
            message: `I couldn't find any games matching "${keyword}". Try using a different genre or keyword.`,
            sender: 'PixelSeeker',
            direction: 'incoming',
          },
        ]);
      }
      setIsTyping(false); // Stop typing indicator
      return;
    }

    // Handle other queries using OpenAI API
    const apiMessages = chatMessages.map((messageObject) => {
      const role = messageObject.sender === 'PixelSeeker' ? 'assistant' : 'user';
      return { role: role, content: messageObject.message };
    });

    const apiRequestBody = {
      model: 'gpt-3.5-turbo', // OpenAI model
      messages: [systemMessage, ...apiMessages],
    };

    await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + API_KEY, // Authorization header with API key
        'Content-Type': 'application/json', // Content type
      },
      body: JSON.stringify(apiRequestBody), // Request payload
    })
      .then((data) => data.json())
      .then((data) => {
        // Add AI response to chat messages
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

        // Display error message
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
      .finally(() => setIsTyping(false)); // Stop typing indicator
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
