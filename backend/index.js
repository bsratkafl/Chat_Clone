// import express
import express from "express";
// import cors
import cors from "cors";

// import dotenv to load environment variables
import "dotenv/config";

// create an instance of express
const app = express();

// use cors middleware to allow cross-origin requests from the frontend; http://localhost:5173
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// import the database connection pool
import db from "./db/db.config.js";
// import the main router
import mainRouter from "./src/api/main.routes.js";

// import the error handler middleware
import { errorHandler } from "./src/middleware/error-handler.js";

// middleware to parse JSON bodies
app.use(express.json());

// use /api for all routes
app.use("/api", mainRouter);

// use the error handler middleware
app.use(errorHandler);

// start the server
const PORT = process.env.PORT;

// start the server and listen on the specified port and check if the database connection is successful
const startServer = async () => {
  try {
    // test the database connection
    const connection = await db.getConnection();
    // release the connection back to the pool
    connection.release();
    console.log("Database connection successful!");

    // start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
};
startServer();
