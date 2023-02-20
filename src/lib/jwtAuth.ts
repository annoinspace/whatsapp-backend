import { RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import { UserDocument } from "../api/users/types";
import { TokenPayload, verifyAccessToken } from "./tools";

export interface UserRequest extends Request {
  user?: Partial<UserDocument>;
}

export const JwtAuthenticationMiddleware: RequestHandler = async (
  req: UserRequest,
  res,
  next
) => {
  if (!req.headers.authorization) {
    next(
      createHttpError(
        401,
        "Please provide Bearer Token in the authorization header"
      )
    );
  } else {
    try {
      const accessToken = req.headers.authorization.replace("Bearer ", "");

      const payload = await verifyAccessToken(accessToken);

      req.user = {
        _id: payload._id,
      };
      next();
    } catch (error) {
      console.log(error);
      next(createHttpError(401, "Token not valid!"));
    }
  }
};
