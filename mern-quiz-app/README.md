# QuizHub — MERN Quiz App

A full MERN stack quiz app: create/edit/delete quizzes, browse & search by topic,
share quizzes via public links, and take quizzes **one question at a time**.

## Structure
```
mern-quiz-app/
  server/   Express + MongoDB API
  client/   React (Vite) + Tailwind frontend
```

## Setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env   # then edit MONGO_URI / JWT_SECRET
npm run dev             # starts on http://localhost:5000
```
Requires a running MongoDB instance (local or Atlas) at the URI in `.env`.

### 2. Frontend
```bash
cd client
npm install
npm run dev              # starts on http://localhost:5173
```
The Vite dev server proxies `/api` requests to `http://localhost:5000` (see `vite.config.js`).

## Key Flows

- **Sign up / Log in** → JWT stored in localStorage, attached to requests via axios interceptor.
- **Create quiz** (`/create`) → add title, topic, description, and one or more questions
  (each with 2+ options, one marked correct).
- **My Quizzes** (`/my-quizzes`) → edit/delete your own quizzes, copy their share links.
- **Browse / Search** (`/`) → anyone (logged in or not) can search public quizzes by topic.
- **Take a quiz** (`/quiz/share/:slug`) → public link; `QuizPlayer` shows **one question
  at a time** with a progress bar, Back/Next navigation, and a results/review screen
  with score at the end.

## API Summary

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Current user (auth) |
| GET | /api/auth/api-key | View your integration API key (auth) |
| POST | /api/auth/api-key/regenerate | Rotate your API key (auth) |
| GET | /api/quizzes?topic=xyz | Search public quizzes by topic |
| GET | /api/quizzes?mine=true | List your own quizzes (auth) |
| POST | /api/quizzes | Create quiz (auth) |
| GET | /api/quizzes/:id | Get quiz w/ answers (owner only) |
| PUT | /api/quizzes/:id | Update quiz (owner only) |
| DELETE | /api/quizzes/:id | Delete quiz (owner only) |
| GET | /api/quizzes/share/:slug | Public quiz view (answers hidden) |
| POST | /api/quizzes/:id/attempt | Submit answers, get score + review |
| POST | /api/integrations/quizzes | **n8n / bulk import** — create one or many quizzes via API key |

## n8n Integration

Every user has an auto-generated **API key** (view/rotate it at `/settings` in the app,
or via `GET /api/auth/api-key`). Point your n8n HTTP Request node here:

- **Method:** `POST`
- **URL:** `http://<your-server>/api/integrations/quizzes`
- **Header:** `x-api-key: <your key>`
- **Body (JSON)** — single quiz:
  ```json
  {
    "title": "Capitals of the World",
    "topic": "Geography",
    "description": "10 quick questions",
    "isPublic": true,
    "questions": [
      { "questionText": "Capital of France?", "options": ["Paris","Rome","Berlin","Madrid"], "correctAnswer": "Paris" },
      { "questionText": "Capital of Japan?", "options": ["Seoul","Tokyo","Beijing","Hanoi"], "correctOptionIndex": 1 }
    ]
  }
  ```
- **Bulk import** — wrap multiple quizzes: `{ "quizzes": [ <quiz>, <quiz>, ... ] }`
- Each question accepts **either** `correctOptionIndex` (number) **or** `correctAnswer`
  (the answer text, matched case-insensitively against `options`) — useful since
  LLM-generated JSON from n8n often produces the answer as text rather than an index.
- Response reports `createdCount`/`failedCount` with per-quiz `shareUrl` and a `failed[]`
  array describing exactly which entries were invalid and why — so a bad question in a
  50-question batch doesn't block the rest.

## Notes / Next Steps
- Add pagination to the browse/search list as data grows.
- Add rate limiting on the public share + attempt + integration routes.
- Optionally require a guest name before taking a shared quiz, and store attempt history per user.
