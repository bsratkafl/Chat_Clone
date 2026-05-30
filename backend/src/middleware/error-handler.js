import { StatusCodes } from "http-status-codes";

export const errorHandler = (err, req, res, next) => {
  let customError = {
    // set default error status code and message
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong! try again later.",
  };

  return res.status(customError.statusCode).json({
    success: false,
    message: customError.message,
  });
};
