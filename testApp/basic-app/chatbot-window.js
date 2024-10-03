// chatbot-window.js

import { v4 as uuidv4 } from 'uuid';
import { Resizable } from 're-resizable';
import { MessageCircle, X, Send, User, Bot, createIcons } from 'lucide';
// import './globals.css'

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
    const tailwindCSS = `
     <link href="tailwind.css" rel="stylesheet">
    `;

    const template = this.isExpanded ? this.expandedTemplate() : this.collapsedTemplate();
    
    this.shadowRoot.innerHTML = `
      ${tailwindCSS}
      ${template}
    `;

    createIcons({
      icons: {
        MessageCircle, 
        X, 
        Send, 
        User, 
        Bot
      }
    }) 
    this.setupEventListeners();
  }

  collapsedTemplate() {
    return `
      <button class="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl bg-primary text-primary-foreground">
        <i data-lucide="message-circle"></i>
        <span class="sr-only">Open chat</span>
      </button>
    `;
  }

  expandedTemplate() {
    return `
      <div class="fixed bottom-4 right-4 z-50">
        <div class="w-[${this.windowSize.width}px] h-[${this.windowSize.height}px] flex flex-col shadow-xl transition-all duration-300 ease-in-out bg-background rounded-lg border border-border">
          <div class="p-3 flex flex-row items-center justify-between border-b border-border">
            <h3 class="font-semibold text-lg">Chat Bot</h3>
            <button class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x"></i>
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
                <i data-lucide="send"></i>
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
        ${message.type === 'ai' ? '<i data-lucide="bot" class="h-6 w-6 mx-2 flex-shrink-0 text-primary"></i>' : '<i data-lucide="user" class="h-6 w-6 mx-2 flex-shrink-0 text-primary"></i>'}
        <div class="inline-block p-2 rounded-lg max-w-[70%] break-words ${message.type === 'human' ? 'bg-primary text-primary-foreground' : 'bg-muted'}">
          <span class="whitespace-pre-wrap overflow-wrap-anywhere">${message.content}</span>
        </div>
      </div>
    `).join('');
  }

  renderTypingIndicator() {
    return `
      <div class="flex items-start mb-4">
        <i data-lucide="bot" class="h-6 w-6 mr-2 flex-shrink-0 text-primary"></i>
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
      const resizableElement = this.shadowRoot.querySelector('div[class^="fixed bottom-4 right-4"]');
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

    this.ws = new WebSocket(`wss://scubotbackend.net/socket/${this.socket_id}`);

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