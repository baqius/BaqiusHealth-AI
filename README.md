# BaqiusHealth AI

**An AI-powered healthcare assistant for symptom guidance, medication support, and doctor appointment booking.**

> ⚠️ **Medical disclaimer:** BaqiusHealth AI is an informational and demonstration tool. It is **not** a medical device and does not provide medical diagnosis or treatment. It must not replace advice from a licensed healthcare professional. **In an emergency, call your local emergency number immediately.**

---

## Overview

BaqiusHealth AI is a full-stack web application that brings several everyday healthcare tasks into one interface. Users can chat with an AI assistant about symptoms, causes, and medications, browse specialists, book in-clinic or telehealth appointments through an integrated calendar, and keep track of their medication cabinet.

The assistant is powered by the **Google Gemini API**, called from a server-side Express layer so the API key is never exposed to the browser. A built-in, rule-based clinical engine acts as a fallback, so the chat keeps responding even when the AI service is slow, unavailable, or rate-limited.


## Key Features

###  Conversational Health Assistant
- Real-time **streaming responses** (Server-Sent Events) for a responsive typing experience.
- Answers questions about **symptoms**, **causes**, **medications**, **dosing and missed doses**, **side effects**, **drug interactions**, and **diet and lifestyle**.
- **Context-aware conversations:** follow-ups such as "how do I take it?" or "what causes that?" resolve to the condition, medication, or doctor discussed earlier.
- Detects when a conversation is ending or restarting and manages the session accordingly.
- **Emergency detection** for red-flag phrases, with immediate guidance to contact emergency services.
- Persistent emergency banner reminding users that the tool is for non-emergency triage only.

###  Appointment Booking
- Book directly from chat: ask for an appointment, pick from the offered time slots, and receive an in-chat confirmation card.
- Dedicated **Doctors** directory with specialty, experience, ratings, languages, consultation fees, and key conditions treated.
- **Calendar-based booking** with date selection, time slots grouped by morning, afternoon, and evening, and a booking modal.
- Choose between **telehealth** and **in-clinic** visits.
- **My Appointments** view to review, reschedule, or cancel bookings.

###  Telehealth Room
- Simulated video consultation room with microphone and camera toggles, a session timer, and in-room chat.

###  Medication Cabinet
- Track active medications with dosage, frequency, food interaction, prescriber, start date, and refills.
- Medications are organized by category (Cardiovascular, Metabolic, Infection, Pain/Inflammation, Mental Health, Supplement, Other).
- The patient's active medications are passed to the assistant so its answers can account for them.

###  Resilience
- **Graceful fallback:** a local clinical engine answers when Gemini is unavailable.
- **4-second AI timeout** to keep replies snappy.
- **Quota circuit breaker:** after an HTTP 429 or quota error, AI calls pause for 65 minutes and the fallback engine takes over.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Animation and icons | Motion, Lucide React |
| Backend | Node.js, Express 4, `tsx` |
| AI | Google Gemini via `@google/genai` |
| Configuration | `dotenv` |
| Typography | Plus Jakarta Sans, JetBrains Mono (Google Fonts) |

## Architecture

```
┌──────────────────────────┐        ┌─────────────────────────────────────────┐
│  React SPA (Vite)        │        │  Express server (server.ts)             │
│                          │  HTTP  │                                         │
│  • ChatAssistant         │ ─────▶ │  POST /api/chat/stream  (SSE)           │
│  • Doctors / Calendar    │        │  POST /api/chat         (JSON)          │
│  • Appointments          │ ◀───── │                                         │
│  • Medication Cabinet    │        │   ┌──────────────┐   ┌───────────────┐  │
│                          │        │   │ Gemini API   │   │ Local clinical│  │
│  State: React + local-   │        │   │ (primary)    │   │ engine        │  │
│  Storage                 │        │   └──────────────┘   │ (fallback)    │  │
└──────────────────────────┘        │                      └───────────────┘  │
                                    └─────────────────────────────────────────┘
```

In development, Express mounts Vite as middleware, so the frontend and API run on a single port. In production, Express serves the pre-built static files from `dist/`.


## Getting Started

### Prerequisites

- **Node.js** 20.19 or later (required by Vite) and **npm**
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) (optional, see note below)

> The app runs without an API key. In that case every response comes from the built-in clinical engine rather than Gemini.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/baqius/BaqiusHealth-AI.git
cd BaqiusHealth-AI

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```env
GEMINI_API_KEY="your-gemini-api-key"
```

### Run in Development

```bash
npm run dev
```

The app is served at **http://localhost:3000** with Vite hot module replacement.

### Build and Run in Production

```bash
npm run build                      # Build the frontend into dist/
NODE_ENV=production npm start      # Serve dist/ and the API
```

On Windows PowerShell, use `$env:NODE_ENV="production"; npm start`.

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | No (recommended) | none | Google Gemini API key. If missing or left as the placeholder, the server uses only the local fallback engine. |
| `APP_URL` | No | none | Public URL where the app is hosted. Injected automatically by AI Studio / Cloud Run. |
| `PORT` | No | `3000` | Port the Express server listens on. |
| `NODE_ENV` | No | development | Set to `production` to serve the built `dist/` bundle instead of the Vite dev server. |
| `DISABLE_HMR` | No | `false` | Set to `true` to disable Vite hot module replacement and file watching. |

> **Security:** `.env` files are git-ignored. Never commit real API keys.

The Gemini model name and the AI timeout are defined at the top of the chat handlers in `server.ts`. Adjust them there if you want to use a different model or allow longer responses.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express server with Vite middleware (development) |
| `npm run build` | Build the production frontend into `dist/` |
| `npm start` | Start the Express server (serves `dist/` when `NODE_ENV=production`) |
| `npm run preview` | Preview the Vite build locally |
| `npm run lint` | Type-check the project with `tsc --noEmit` |
| `npm run clean` | Remove `dist/` and `server.js` |

## API Reference

### `POST /api/chat/stream`

Streams the assistant's reply as Server-Sent Events.

**Request body**

```json
{
  "messages": [
    { "role": "user", "content": "What causes migraines?" }
  ],
  "currentMedications": [
    { "name": "Lisinopril", "dosage": "10 mg" }
  ]
}
```

**Stream events** (`data: <json>`)

```jsonc
// Incremental text
{ "chunk": "Migraines involve neurovascular activation..." }

// Final event
{
  "done": true,
  "booking": null,                 // present when an appointment was confirmed
  "availableSlots": null,          // present when time slots are being offered
  "isConversationEnded": false,
  "isNewConversationStart": false
}
```

### `POST /api/chat`

Non-streaming alternative with the same request body. Returns a single JSON object:

```json
{
  "content": "Answer text",
  "booking": null,
  "availableSlots": null,
  "isConversationEnded": false,
  "isNewConversationStart": false
}
```

Returns `400` if `messages` is missing or empty, and `500` on unexpected server errors.

## How the AI Assistant Works

1. **Prompt assembly.** The server combines the user's active medications, the last few messages, and the current prompt, and sends them to Gemini with a clinical system instruction.
2. **Structured commands.** The model is instructed to append machine-readable markers (`BOOKING:`, `SLOTS:`, `CONVERSATION:`) followed by JSON. The server strips these from the visible text and converts them into structured fields for the UI, such as booking confirmation cards and slot pickers.
3. **Fallback engine.** Before calling Gemini, the server pre-computes a rule-based answer. It is used if the API key is missing, the request times out, the quota is exhausted, or the stream yields nothing. It handles intent classification (booking, symptoms, causes, medications, interactions, missed doses, side effects, lifestyle), emergency keywords, and multi-turn context resolution.
4. **Doctor routing.** A catalog of six specialties (Cardiology, General Practice, Dermatology, Orthopedics, Neurology, Endocrinology) maps symptoms and keywords to the most relevant doctor when booking.

## Data and Privacy

- **No database.** Appointments and medications are stored in the browser's `localStorage`, so data stays on the user's device and is not shared across devices or browsers.
- **Seed data is fictional.** The doctors, clinics, and sample patient and medications are placeholders for demonstration. Appointments are not sent to any real clinic.
- **Server-side AI calls.** Chat messages and the active medication list are sent to the Gemini API to generate responses. Review [Google's API terms](https://ai.google.dev/gemini-api/terms) before handling real patient data.
- This project has **not** been assessed for HIPAA, GDPR, or other regulatory compliance. Do not use it with real protected health information without a proper compliance review.

## Deployment

The app is a single Node.js process, so it can run anywhere Node is available.

- **Google AI Studio / Cloud Run:** `GEMINI_API_KEY` and `APP_URL` are injected automatically.
- **Other platforms** (Render, Railway, Fly.io, a VPS, Docker): run `npm install && npm run build`, set `NODE_ENV=production` and `GEMINI_API_KEY`, then start with `npm start`. Bind to the `PORT` provided by the platform.
