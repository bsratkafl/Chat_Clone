import express from "express";
// import the chat router
import chatRouter from "./chat/chat.routes.js";

// create a router for main routes
const mainRouter = express.Router();

// api/chat
mainRouter.use("/chat", chatRouter);

// export the main router
export default mainRouter;
