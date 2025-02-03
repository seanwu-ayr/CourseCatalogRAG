# Fullstack Chatbot - Public Repository

This repository contains the documentation and high-level overview of the Fullstack Chatbot project. Due to the private nature of the code, this public repository serves as a reference for understanding the architecture, technologies used, and implementation details.

![SCU Chatbot frontend](https://github.com/user-attachments/assets/c48b8e6f-0b38-4253-b7c6-5f55e26011b2)

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [General Architecture](#general-architecture)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Fullstack Chatbot is an advanced conversational AI system designed to interact with users through a web interface. It leverages a custom language model (LLM) flow, Retrieval-Augmented Generation (RAG), and LangChain to provide contextually rich and accurate responses. The chatbot supports streaming responses for real-time interaction.

## Features

### Current Features

- **Responsive Frontend:** Built with Next.js and React, providing a smooth and dynamic user experience.
- **Scalable Backend:** Developed using Django with ASGI support, enabling high concurrency and real-time communication.
- **Custom LLM Flow:** Integrates a custom language model pipeline tailored for specific conversational contexts.
- **RAG Integration:** Enhances the chatbot's responses with relevant information retrieval.
- **Streaming Responses:** Real-time streaming of responses for seamless conversation.
- **Webhooks:** Utilized for triggering events and processing asynchronous tasks.
- **Real-time Chatbot Interaction:** Uses WebSocket and ASGI for live communication.
- **Basic Frontend UI:** Simple and functional interface for chatbot interaction.

### Awaiting Features

- Conversation history (user-specific).
- Conversation history (data analysis).
- Login UI and authentication.
- Add/Delete/Search conversations.

## Technologies Used

### Frontend
- **Next.js:** A React framework for server-side rendering and static site generation.
- **React:** JavaScript library for building user interfaces.
- **Webhooks:** For handling asynchronous events and communication between the frontend and backend.

### Backend
- **Python Django:** A high-level Python web framework for rapid development and clean, pragmatic design.
- **ASGI (Asynchronous Server Gateway Interface):** For handling asynchronous tasks and real-time data streaming.
- **LangChain:** Framework for developing applications powered by large language models.
- **RAG (Retrieval-Augmented Generation):** Combines language models with information retrieval for more accurate responses.

### Database
- **Database Integration:** Django's ORM for interacting with a relational database (e.g., PostgreSQL, MySQL, SQLite).

## Architecture

The Fullstack Chatbot is composed of the following key components:

- **Frontend:** Next.js application with React components, handling user interactions and sending requests to the backend via webhooks.
- **Backend:** Django application that processes requests, manages the database, and interacts with the custom LLM and RAG systems.
- **ASGI Server:** Facilitates real-time communication and streaming responses between the backend and frontend.
- **Custom LLM Flow:** Tailored language model pipeline integrated with RAG for enhanced conversational capabilities.

## Repository Structure

- **Frontend: `frontend/`**
  - The main frontend logic is located in `frontend/components/chatpage.tsx`.
- **Backend: `backend/`**
  - The main backend logic is located in `backend/langchain_stream_views.py`.

## Installation

### Prerequisites

- Conda (recommended) or other virtual environments
- Node.js and npm

### Clone the Repository

```bash
git clone https://github.com/seogenis/CourseCatalogRAG.git
cd CourseCatalogRAG
git checkout main
```

### MAKE YOUR OWN BRANCH FOR CHANGES

### Backend Setup

#### Create and Activate Conda Environment:

```bash
conda create -n chatbot-env python=3.12
conda activate chatbot-env
```

#### Install Backend's Python Dependencies:

```bash
pip install -r requirements.txt
```

#### Set Up Environment Variables:

Create a `.env` file in the root directory with the following content:

```makefile
OPENAI_API_KEY="your_api_key_here"
```

#### Run the Backend Server:

```bash
python manage.py runserver
```

### Frontend Setup

#### Install Frontend Dependencies:

```bash
cd ../frontend
npm install
```

#### Run the Frontend Server:

```bash
npm run dev
```

## General Architecture

- The application uses ASGI in the backend and WebSockets in the frontend to enable real-time communication, asynchronous task execution, and chat response streaming capabilities. 
- Langchain chatbot is integrated and streamed from `backend/langchain_stream_views.py`.

## Download

To download this repository as a ZIP file, use:

```bash
git archive --format=zip --output=fullstack_chatbot.zip main
```

Alternatively, you can download it from GitHub's web interface.

