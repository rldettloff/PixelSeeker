import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';
const API_KEY = import.meta.env.VITE_API_KEY;

// System message to determine how ChatGPT should respond
const systemMessage = { 
  "role": "system", "content": "Explain things like you're talking to a software professional with 2 years of experience."
}

// Main App component
function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm PixelSeeker! Ask me about games and stuff!",
      direction: "incoming",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Function to handle sending messages
  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    // Add the new message to the state
    setMessages(newMessages);

    // Set isTyping to true to show the typing indicator
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  // Function to process messages to ChatGPT
  async function processMessageToChatGPT(chatMessages) { 

    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message}
    });


// API request body
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,  
        ...apiMessages 
      ]
    }
// Fetch request to OpenAI API
    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "ChatGPT",
        direction: "incoming",

      }]);
      setIsTyping(false);
    });
  }

  // Return the main App component
  return (
    <div className="App">
      <div style={{ position:"relative", height: "800px", width: "700px"  }}>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing" /> : null}
            >
              {messages.map((message, i) => {
                console.log(message)
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App