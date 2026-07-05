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
| GET | /api/quizzes?topic=xyz | Search public quizzes by topic |
| GET | /api/quizzes?mine=true | List your own quizzes (auth) |
| POST | /api/quizzes | Create quiz (auth) |
| GET | /api/quizzes/:id | Get quiz w/ answers (owner only) |
| PUT | /api/quizzes/:id | Update quiz (owner only) |
| DELETE | /api/quizzes/:id | Delete quiz (owner only) |
| GET | /api/quizzes/share/:slug | Public quiz view (answers hidden) |
| POST | /api/quizzes/:id/attempt | Submit answers, get score + review |

## Notes / Next Steps
- Add pagination to the browse/search list as data grows.
- Add rate limiting on the public share + attempt routes.
- Optionally require a guest name before taking a shared quiz, and store attempt history per user.
