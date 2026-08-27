# AskFlow AI - Simple Full-Stack AI Application

AskFlow AI is a production-grade full-stack conversational AI application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js with Express.js**, **Supabase Auth & PostgreSQL (with Row Level Security)**, and the official **Google Gemini API SDK (`@google/genai`)**.

---

## 🌟 Key Features

- 🔒 **User Authentication**: Secure Signup, Login, and Logout powered by Supabase Auth.
- 🛡️ **Protected Application Pages**: React Router route guarding enforcing session authentication.
- 📱 **Responsive Sidebar Layout**: Left sidebar menu with Dashboard and AI Chatbot links, and logged-in user profile info & logout button at the bottom.
- 📊 **Dashboard**: Welcome banner with logged-in user name and two primary metric cards (Total AI conversations & Start new chat button).
- 💬 **AI Chatbot**: Real-time chat interface connected to Google Gemini 2.5 (`@google/genai`) via Node.js Express backend.
- 🔐 **Database & Row Level Security (RLS)**: Conversations and messages are saved in Supabase PostgreSQL, isolated per user using RLS policies.
- 🔑 **Backend API Key Security**: Gemini API key and Supabase service-role credentials strictly managed on the server side — never exposed to the frontend.

---

## 📁 Repository Structure

```
Build_to_ship_workshop/
├── client/                     # Frontend React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # Sidebar, AppLayout, ProtectedRoute
│   │   ├── context/            # AuthContext (Supabase Auth session state)
│   │   ├── lib/                # supabase.ts client, api.ts fetch wrapper
│   │   ├── pages/              # Login, Signup, Dashboard, Chat
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Route definitions
│   │   ├── index.css           # Tailwind CSS directives & glassmorphic styling
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
├── server/                     # Backend Node.js + Express.js + TypeScript
│   ├── src/
│   │   ├── config/             # env.ts, supabase.ts, gemini.ts (@google/genai)
│   │   ├── middleware/         # auth.ts (Supabase JWT verifier)
│   │   ├── routes/             # conversations.ts, chat.ts
│   │   ├── services/           # geminiService.ts
│   │   ├── validators/         # schemas.ts (Zod validation schemas)
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── supabase/
│   └── migrations/
│       └── 01_schema.sql       # PostgreSQL schema & Row Level Security policies
├── package.json                # Root workspace configuration
└── README.md                   # Application documentation & setup guide
```

---

## 🚀 Quick Setup Instructions

### 1. Database Setup (Supabase)

1. Create a free project at [Supabase](https://supabase.com/).
2. Open your Supabase Dashboard -> **SQL Editor**.
3. Copy and paste the contents of `supabase/migrations/01_schema.sql` into the SQL Editor and click **Run**.
   - This creates `conversations` and `messages` tables with Row Level Security (RLS) policies.
4. Retrieve your Supabase API credentials from **Project Settings -> API**:
   - `Project URL`
   - `anon / public` key
   - `service_role` key (optional for backend admin operations)

---

### 2. Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy your API Key.

---

### 3. Environment Variables Configuration

#### Backend (`/server/.env`)
Create a file named `server/.env` based on `server/.env.example`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_actual_gemini_api_key_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

#### Frontend (`/client/.env`)
Create a file named `client/.env` based on `client/.env.example`:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 4. Install Dependencies

In the root directory, run:
```bash
npm run install:all
```
*Or manually:*
```bash
cd server && npm install
cd ../client && npm install
```

---

### 5. Start the Application

To run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔒 Security Architecture

1. **API Keys Protection**: Frontend never touches `GEMINI_API_KEY`. All LLM calls pass through the Node.js backend `/api/chat` route.
2. **Supabase Auth JWT**: Every request sent from frontend `api.ts` includes `Authorization: Bearer <supabase_access_token>`.
3. **Database RLS Policies**: Supabase PostgreSQL tables `conversations` and `messages` enforce `auth.uid() = user_id`, guaranteeing users can never access or modify another user's chat history.
4. **Input Validation**: Zod validates all API payload parameters (`message`, `conversationId`) before processing.
