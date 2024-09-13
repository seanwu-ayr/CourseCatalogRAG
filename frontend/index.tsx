import ChatbotWindow from "@/components/chatbot_window";
// import TestComponent from "@/components/test_component";
import { createRoot } from "react-dom/client";
import React from 'react';
// import './app/globals.css';
// Make sure to target the correct element

function renderChatbotWindow(rootId: string) {
  const rootElement = document.getElementById(rootId);
  const root = createRoot(rootElement!); // Use createRoot in React 18
  // chatRoot.render(<ChatbotWindow />);
  root.render(<ChatbotWindow />);
}

function importChatbotWindow() {
    return <ChatbotWindow />
}

export { renderChatbotWindow, importChatbotWindow };