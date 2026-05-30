// import the database connection pool
import db from "../../../db/db.config.js";

// import the http status codes
import { StatusCodes } from "http-status-codes";

// import the Google GenAI client library
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// create an instance of the Google GenAI client
const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Reads the latest conversation messages from MySQL.
// We fetch newest rows first for speed, then reverse them so Gemini receive
//  the chat in normal reading order: oldest message first, newest message last.
export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  const [rows] = await db.execute(
    `SELECT id, role, content, created_at
     FROM conversations
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
  );
  return rows.reverse();
};

// Sends the user's question to Gemini and returns the assistant's text response.
// The database stores roles as "user" and "assistant", but Gemini expects
// "user" and "model", so this function converts the old messages first.
const generateAssistantAnswer = async ({ historyRows, question }) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      maxOutputTokens: 1024,
      systemInstruction: `You are a specialized assistant for programming, software engineering, computer science, and IT-related topics.

            Only answer questions that are related to:
            - Programming and coding
            - Debugging
            - Software engineering
            - Web development
            - Backend and frontend development
            - Databases
            - APIs
            - Computer science concepts
            - DevOps, cloud, networking, and IT systems
            - Cybersecurity from a defensive or educational perspective
            - Developer tools, frameworks, libraries, and architecture

            If the user asks about something outside these areas, politely refuse and redirect them back to a technical topic.

            Do not answer questions about unrelated topics such as general life advice, politics, entertainment, health, law, personal relationships, or non-technical subjects unless the question clearly connects to software, computers, or IT.

            When answering technical questions:
            - Be clear and beginner-friendly when needed.
            - Use examples when helpful.
            - Explain code step by step.
            - Prefer practical, accurate answers.
            - If you are unsure, say so instead of guessing.
            
            `,
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({
    message: question,
  });

  // console.log(result.usageMetadata);
  // console.log(result.usageMetadata?.totalTokenCount);
  return {
    text: result.text || "",
    totalTokenCount: result.usageMetadata?.totalTokenCount || 0,
  };
};

// Gets one saved message by its id and converts database column names into
// frontend-friendly property names, like token_count -> tokenCount.
const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

// Main service for POST /api/chat/conversations.
// It validates the user's question, saves the user question, asks Gemini for an answer, saves the assistant message, and returns both saved rows.
export const postConversationService = async (question) => {
  try {
    if (typeof question !== "string" || !question.trim()) {
      const error = new Error(
        "Question is required and must be a non-empty string.",
      );
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    const cleanQuestion = question.trim();

    const historyRows = await getRecentConversationRows(5);

    const [createUserMessageResult] = await db.execute(
      "INSERT INTO conversations (content,role) VALUES (?,?)",
      [cleanQuestion, "user"],
    );

    const { text: assistantAnswer, totalTokenCount } =
      await generateAssistantAnswer({
        historyRows,
        question: cleanQuestion,
      });

    const [createAssistantMessageResult] = await db.execute(
      "INSERT INTO conversations (role,content,token_count) VALUES (?,?,?)",
      ["assistant", assistantAnswer, totalTokenCount],
    );

    const userConversation = await getMessageById(
      createUserMessageResult.insertId,
    );
    const assistantConversation = await getMessageById(
      createAssistantMessageResult.insertId,
    );

    // return the conversation with the answer to the controller
    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    // Let the controller/error middleware decide how to send the error response.
    throw error;
  }
};
