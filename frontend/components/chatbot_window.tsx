"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, User, Bot } from "lucide-react"

// Define types for the response message and WebSocket ref

type message_type = 'human' | 'ai' | 'system' | 'function' | 'tool'

interface ResponseMessage {
  content: string;
  type: message_type;
  id?: string; // id is optional
  name?: string; // name is optional
  response_metadata?: object; // response metadata is optional
  additional_kwargs?: object; //additional kwargs is optional
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)

export default function Chatwindow() {
  const [isExpanded, setIsExpanded] = useState(false)
  const starterMessage: ResponseMessage = { id: '', content: "Hello! How can I help you today?", type: "ai" }
  const [messages, setMessages] = useState([starterMessage])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollAreaRef = useRef(null)
  // Ref to manage the WebSocket connection
  const ws = useRef<WebSocket | null>(null);
  // Maximum number of attempts to reconnect
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const maxReconnectAttempts = 5;

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollableNode = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollableNode) {
        scrollableNode.scrollTo({
          top: scrollableNode.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [])

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom()
    }
  }, [messages, isExpanded, scrollToBottom])

  const setupWebSocket = () => {
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws/chat/');
    let ongoingStream: { id: string; content: string } | null = null; // To track the ongoing stream's ID

    ws.current.onopen = () => {
      console.log("WebSocket connected!");
      setReconnectAttempts(0); // Reset reconnect attempts on successful connection
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // const newMessage: ResponseMessage = {type: 'ai', content: data.answer}
      // setResponses(prevResponses => [...prevResponses, newMessage]);

      // let type_of_message: message_type = data.name == 'ai' ? 'ai' : 'human'

      // Handle different types of events from the WebSocket

      if (data.event === 'start') {
        setIsThinking(false)
        // When a new stream starts
        ongoingStream = { id: data.id, content: '' };
        const newMessage: ResponseMessage = {type: 'ai', content: '', id: data.id}
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else if (data.event === 'stream' && ongoingStream && data.id === ongoingStream.id) {
        // During a stream, appending new chunks of data
        setMessages(prevMessages => prevMessages.map(msg =>
          msg.id === data.id ? { ...msg, content: msg.content + data.chunk } : msg));
      }
    };

    ws.current.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };

    ws.current.onclose = (event) => {
      console.log(`WebSocket is closed now. Code: ${event.code}, Reason: ${event.reason}`);
      handleReconnect();
    };
  };

  // Function to handle reconnection attempts with exponential backoff
  const handleReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      let timeout = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        setupWebSocket(); // Attempt to reconnect
      }, timeout);
    } else {
      console.log("Max reconnect attempts reached, not attempting further reconnects.");
    }
  };

  // Effect hook to setup and cleanup the WebSocket connection
  useEffect(() => {
    setupWebSocket(); // Setup WebSocket on component mount

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close(); // Close WebSocket on component unmount
      }
    };
  }, []);


  const handleSendMessage = (e: FormEvent) => {
    if (inputValue.trim()) {
      // setMessages([...messages, { id: messages.length + 1, text: inputValue, sender: "user" }])
      setInputValue("") //Clear input field
      setIsThinking(true)

      const userMessage: ResponseMessage = { type: "human", content: inputValue };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      ws.current?.send(JSON.stringify({ user_input: inputValue, history: messages})); // Send message through WebSocket


      // Here you would typically call an API to get the bot's response
      // setTimeout(() => {
      //   setIsThinking(false)
      //   setMessages(prev => [...prev, { id: prev.length + 1, text: "I'm a demo bot. I can't actually respond!", sender: "bot" }])
      // }, 2000)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <Button
          onClick={toggleExpand}
          className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      ) : (
        <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-xl transition-all duration-300 ease-in-out">
          <CardHeader className="p-3 flex flex-row items-center justify-between">
            <h3 className="font-semibold text-lg">Chat Bot</h3>
            <Button variant="ghost" size="icon" onClick={toggleExpand}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex items-start ${
                    message.type === 'human' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'ai' && (
                    <Bot className="h-6 w-6 mr-2 text-primary" />
                  )}
                  <span
                    className={`inline-block p-2 rounded-lg max-w-[80%] break-words ${
                      message.type === 'human'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </span>
                  {message.type === 'human' && (
                    <User className="h-6 w-6 ml-2 text-primary" />
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="flex items-start mb-4">
                  <Bot className="h-6 w-6 mr-2 text-primary" />
                  <span className="inline-block p-2 rounded-lg bg-muted">
                    <TypingIndicator />
                  </span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage(e)
              }}
              className="flex w-full items-center space-x-2"
            >
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}