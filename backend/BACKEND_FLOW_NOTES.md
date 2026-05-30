# Backend Flow Notes

This backend is an Express API. Its job is to receive a chat question from the
frontend, save the message in MySQL, ask Gemini for an answer, save Gemini's
answer, and send both saved messages back to the frontend.

## Simple Diagram

```text
Frontend React app
    |
    | POST /api/chat/conversations
    v
backend/index.js
    |
    | sends all /api requests to mainRouter
    v
src/api/main.routes.js
    |
    | sends /api/chat requests to chatRouter
    v
src/api/chat/chat.routes.js
    |
    | calls the matching controller function
    v
src/api/chat/chat.controller.js
    |
    | calls service code for the real work
    v
src/api/chat/chat.service.js
    |
    | talks to both MySQL and Gemini
    v
MySQL database + Google Gemini API
```

## What Each File Does

`index.js`

- Starts the Express server.
- Enables CORS so the frontend can call the backend.
- Enables `express.json()` so `req.body` works with JSON requests.
- Mounts all API routes under `/api`.
- Connects the error handler at the end.

`src/api/main.routes.js`

- Creates the main API router.
- Sends every `/api/chat/...` request to the chat routes file.

`src/api/chat/chat.routes.js`

- Defines the chat URLs.
- `POST /api/chat/conversations` creates a new user and assistant message.
- `GET /api/chat/conversations` fetches recent saved messages.

`src/api/chat/chat.controller.js`

- Reads data from the request, like `req.body.question`.
- Calls the service function.
- Sends the JSON response back to the frontend.
- Passes errors to the error handler with `next(error)`.

`src/api/chat/chat.service.js`

- Contains the main business logic.
- Reads and writes conversation rows in MySQL.
- Converts database messages into the format Gemini expects.
- Calls Gemini and returns the assistant answer.

`db/db.config.js`

- Creates the MySQL connection pool.
- Other files import this pool as `db`.

`src/middleware/error-handler.js`

- Catches errors from controllers and services.
- Sends a consistent JSON error response.

## chat.service.js In Plain English

`getRecentConversationRows(limit)`

- Gets the most recent saved messages from the database.
- Reverses them so Gemini sees the conversation from oldest to newest.

`generateAssistantAnswer({ historyRows, question })`

- Takes old messages and the new question.
- Changes the assistant role to Gemini's `model` role.
- Starts a Gemini chat with the previous conversation history.
- Sends the new question to Gemini.
- Returns the answer text and token count.

`getMessageById(messageId)`

- Finds one message after it has been inserted into the database.
- Converts database names like `token_count` into JavaScript names like
  `tokenCount`.

`postConversationService(question)`

- Checks that the question is a real non-empty string.
- Loads recent chat history.
- Saves the user's question in MySQL.
- Asks Gemini for the assistant response.
- Saves the assistant response in MySQL.
- Returns both saved messages to the controller.

## POST Request Flow

```text
1. Frontend sends:
   { "question": "Explain React props" }

2. Controller receives the request.

3. Service validates the question.

4. Service gets recent conversation history from MySQL.

5. Service saves the user question in MySQL.

6. Service sends the question and history to Gemini.

7. Service saves Gemini's answer in MySQL.

8. Controller sends the result back to the frontend.
```

## Important Environment Variables

```text
PORT=3777
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
GEMINI_API_KEY=...
GEMINI_MODEL=...
```

Keep `GEMINI_API_KEY` private. It should stay in `.env` and should not be
committed to GitHub.
