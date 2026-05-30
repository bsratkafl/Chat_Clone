import {
  postConversationService,
  getRecentConversationRows,
} from "./chat.service.js";
import { StatusCodes } from "http-status-codes";
// Chat controller functions
export const createConversation = async (req, res, next) => {
  try {
    // Implementation for creating a conversation
    const { question } = req.body;

    // send request to .service.js to handle the business logic and database interaction
    const result = await postConversationService(question);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Conversation created successfully.",
      data: result, // result should be the response from the database after inserting the conversation
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const result = await getRecentConversationRows(100); // get recent 100 conversation rows from the database. 
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Conversations fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error); // pass the error to the error handler middleware
  }
};

// export the controller functions
export default {
  createConversation,
  getConversations,
};
