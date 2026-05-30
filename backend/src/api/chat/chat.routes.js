import express from "express";

//import the controller functions for chat routes
import { createConversation, getConversations } from "./chat.controller.js";

// create a router for chat routes
const chatRouter = express.Router();

// POST ROUTE /api/chat/conversations
chatRouter.post("/conversations", createConversation);

// GET ROUTE /api/chat/conversations
chatRouter.get("/conversations", getConversations);

// export the chat router
export default chatRouter;
