"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, User, Bot } from "lucide-react"
import { Resizable } from 're-resizable'

type message_type = 'human' | 'ai' | 'system' | 'function' | 'tool'

interface ResponseMessage {
  content: string;
  type: message_type;
  id?: string;
  name?: string;
  response_metadata?: object;
  additional_kwargs?: object;
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
  const ws = useRef<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const maxReconnectAttempts = 5;
  const [windowSize, setWindowSize] = useState({ width: 384, height: 500 })

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
    ws.current = new WebSocket('wss://scubotbackend.net/ws/');
    let ongoingStream: { id: string; content: string } | null = null;

    ws.current.onopen = () => {
      console.log("WebSocket connected!");
      setReconnectAttempts(0);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'start') {
        setIsThinking(false)
        ongoingStream = { id: data.id, content: '' };
        const newMessage: ResponseMessage = {type: 'ai', content: '', id: data.id}
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else if (data.event === 'stream' && ongoingStream && data.id === ongoingStream.id) {
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

  const handleReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      let timeout = Math.pow(2, reconnectAttempts) * 1000;
      setTimeout(() => {
        setupWebSocket();
      }, timeout);
    } else {
      console.log("Max reconnect attempts reached, not attempting further reconnects.");
    }
  };

  useEffect(() => {
    setupWebSocket();

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setInputValue("")
      setIsThinking(true)

      const userMessage: ResponseMessage = { type: "human", content: inputValue };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      ws.current?.send(JSON.stringify({ user_input: inputValue, history: messages}));
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
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
        <Resizable
          size={{ width: windowSize.width, height: windowSize.height }}
          onResizeStop={(e, direction, ref, d) => {
            setWindowSize({
              width: windowSize.width + d.width,
              height: windowSize.height + d.height,
            })
          }}
          minWidth={300}
          minHeight={400}
          maxWidth={800}
          maxHeight={800}
        >
          <Card className="w-full h-full flex flex-col shadow-xl transition-all duration-300 ease-in-out">
            <CardHeader className="p-3 flex flex-row items-center justify-between">
              <h3 className="font-semibold text-lg">Chat Bot</h3>
              <Button variant="ghost" size="icon" onClick={toggleExpand}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close chat</span>
              </Button>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
              <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex items-start ${
                      message.type === 'human' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {message.type === 'ai' ? (
                      <Bot className="h-6 w-6 mx-2 flex-shrink-0 text-primary" />
                    ) : (
                      <User className="h-6 w-6 mx-2 flex-shrink-0 text-primary" />
                    )}
                    <div
                      className={`inline-block p-2 rounded-lg max-w-[70%] break-words ${
                        message.type === 'human'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <span className="whitespace-pre-wrap overflow-wrap-anywhere">{message.content}</span>
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex items-start mb-4">
                    <Bot className="h-6 w-6 mr-2 flex-shrink-0 text-primary" />
                    <span className="inline-block p-2 rounded-lg bg-muted">
                      <TypingIndicator />
                    </span>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-3">
              <form
                onSubmit={handleSendMessage}
                className="flex w-full items-end space-x-2"
              >
                <Textarea
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={handleInputChange}
                  className="min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button type="submit" size="icon" className="mb-[1px]">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </Resizable>
      )}
    </div>
  )
}