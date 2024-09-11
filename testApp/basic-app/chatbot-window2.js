// chatbot-window.js

import { v4 as uuidv4 } from 'uuid';
import { Resizable } from 're-resizable';
import { MessageCircle, X, Send, User, Bot } from 'lucide';
// import './globals.css';

class ChatbotWindow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this.isExpanded = false;
    this.messages = [{ id: '', content: "Hello! How can I help you today?", type: "ai" }];
    this.inputValue = "";
    this.isThinking = false;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.windowSize = { width: 384, height: 500 };
    this.socket_id = null;
  }

  connectedCallback() {
    this.render();
    this.setupWebSocket();
  }

  disconnectedCallback() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  render() {
    const styles = `
      <style>
        :host {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 222.2 84% 4.9%;
          --radius: 0.5rem;
        }

        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
        }

        * {
          border-color: hsl(var(--border));
        }

        .chatbot-window {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
        }
      </style>
    `;

    const template = this.isExpanded ? this.expandedTemplate() : this.collapsedTemplate();

    this.shadowRoot.innerHTML = `
      ${styles}
      ${template}
    `;

    this.setupEventListeners();
  }

  collapsedTemplate() {
    return `
      <button class="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl bg-primary text-primary-foreground">
        ${MessageCircle.toSvg({ class: 'h-6 w-6' })}
        <span class="sr-only">Open chat</span>
      </button>
    `;
  }

  expandedTemplate() {
    return `
      <div class="chatbot-window fixed bottom-4 right-4 z-50">
        <div class="w-[${this.windowSize.width}px] h-[${this.windowSize.height}px] flex flex-col shadow-xl transition-all duration-300 ease-in-out bg-background rounded-lg border border-border">
          <div class="p-3 flex flex-row items-center justify-between border-b border-border">
            <h3 class="font-semibold text-lg">Chat Bot</h3>
            <button class="text-muted-foreground hover:text-foreground">
              ${X.toSvg({ class: 'h-4 w-4' })}
              <span class="sr-only">Close chat</span>
            </button>
          </div>
          <div class="flex-grow p-0 overflow-hidden">
            <div class="h-full p-4 overflow-y-auto">
              ${this.renderMessages()}
              ${this.isThinking ? this.renderTypingIndicator() : ''}
            </div>
          </div>
          <div class="p-3 border-t border-border">
            <form class="flex w-full items-end space-x-2">
              <textarea
                placeholder="Type your message..."
                class="flex-grow min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows="1"
              ></textarea>
              <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10">
                ${Send.toSvg({ class: 'h-4 w-4' })}
                <span class="sr-only">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  renderMessages() {
    return this.messages.map(message => `
      <div class="mb-4 flex items-start ${message.type === 'human' ? 'flex-row-reverse' : 'flex-row'}">
        ${message.type === 'ai' ? Bot.toSvg({ class: 'h-6 w-6 mx-2 flex-shrink-0 text-primary' }) : User.toSvg({ class: 'h-6 w-6 mx-2 flex-shrink-0 text-primary' })}
        <div class="inline-block p-2 rounded-lg max-w-[70%] break-words ${message.type === 'human' ? 'bg-primary text-primary-foreground' : 'bg-muted'}">
          <span class="whitespace-pre-wrap overflow-wrap-anywhere">${message.content}</span>
        </div>
      </div>
    `).join('');
  }

  renderTypingIndicator() {
    return `
      <div class="flex items-start mb-4">
        ${Bot.toSvg({ class: 'h-6 w-6 mr-2 flex-shrink-0 text-primary' })}
        <span class="inline-block p-2 rounded-lg bg-muted">
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay: 0ms;"></div>
            <div class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay: 150ms;"></div>
            <div class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay: 300ms;"></div>
          </div>
        </span>
      </div>
    `;
  }

  setupEventListeners() {
    const toggleButton = this.shadowRoot.querySelector('button');
    const form = this.shadowRoot.querySelector('form');
    const textarea = this.shadowRoot.querySelector('textarea');

    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleExpand());
    }

    if (form) {
      form.addEventListener('submit', (e) => this.handleSendMessage(e));
    }

    if (textarea) {
      textarea.addEventListener('input', (e) => this.handleInputChange(e));
    }

    // Setup resizable functionality
    if (this.isExpanded) {
      const resizableElement = this.shadowRoot.querySelector('.chatbot-window');
      new Resizable(resizableElement, {
        size: { width: this.windowSize.width, height: this.windowSize.height },
        minWidth: 300,
        minHeight: 400,
        maxWidth: 800,
        maxHeight: 800,
        onResizeStop: (e, direction, ref, d) => {
          this.windowSize = {
            width: this.windowSize.width + d.width,
            height: this.windowSize.height + d.height,
          };
          this.render();
        },
      });
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.render();
  }

  handleSendMessage(e) {
    e.preventDefault();
    if (this.inputValue.trim()) {
      this.sendMessage(this.inputValue);
      this.inputValue = "";
      this.render();
    }
  }

  handleInputChange(e) {
    this.inputValue = e.target.value;
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }

  sendMessage(content) {
    const userMessage = { type: "human", content: content };
    this.messages.push(userMessage);
    this.isThinking = true;
    this.render();

    try {
      this.ws.send(JSON.stringify({ event: 'user_message', user_input: content, history: this.messages }));
    } catch (e) {
      console.error(e);
      if (e.message === 'An attempt was made to use an object that is not, or is no longer, usable') {
        setTimeout(() => {
          this.isThinking = false;
          const newMessage = { type: 'ai', content: 'Connection error. Try again.', id: uuidv4() };
          this.messages.push(newMessage);
          this.render();
        }, 2000);
      }
    }
  }

  setupWebSocket() {
    if (!this.socket_id) {
      this.socket_id = uuidv4();
    }

    this.ws = new WebSocket(`ws://18.116.44.137:80/socket/${this.socket_id}`);

    let heartbeatInterval;
    let ongoingStream = null;

    this.ws.onopen = () => {
      console.log("WebSocket connected!");
      this.reconnectAttempts = 0;

      heartbeatInterval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({event: 'ping'}));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === 'pong') {
        console.log("Received pong, connection is alive");
      } else if (data.event === 'start') {
        this.isThinking = false;
        ongoingStream = { id: data.id, content: '' };
        const newMessage = { type: 'ai', content: '', id: data.id };
        this.messages.push(newMessage);
        this.render();
      } else if (data.event === 'stream' && ongoingStream && data.id === ongoingStream.id) {
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage.id === data.id) {
          lastMessage.content += data.chunk;
          this.render();
        }
      }
    };

    this.ws.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket is closed now. Code: ${event.code}, Reason: ${event.reason}`);
      clearInterval(heartbeatInterval);
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      let timeout = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.setupWebSocket();
      }, timeout);
    } else {
      console.log("Max reconnect attempts reached, not attempting further reconnects.");
    }
  }
}

customElements.define('chatbot-window', ChatbotWindow);