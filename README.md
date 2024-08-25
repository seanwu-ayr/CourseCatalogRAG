
# Chatbot Application

This repository contains a chatbot application with a Next.js/React frontend and a Python Django backend.

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
git checkout redesign
```

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

## Features

### Current Features

- Real-time chatbot interaction using WebSocket and ASGI.
- Basic frontend UI.

### Awaiting Features

- Conversation history (user-specific).
- Conversation history (data analysis).
- Login UI and authentication.
- Add/Delete/Search conversations.

## General Architecture

- The application uses ASGI in the backend and WebSockets in the frontend to enable real-time communication, asynchronous task execution, and chat response streaming capabilities. 
- Langchain chatbot is integrated and streamed from `backend/langchain_stream_views.py`
