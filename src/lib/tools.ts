import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";

export interface TokenPayload {
  _id: ObjectId;
}

export const createAccessToken = (payload: TokenPayload): Promise<string> =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        else res(token as string);
      }
    )
  );

export const verifyAccessToken = (accessToken: string): Promise<TokenPayload> =>
  new Promise((res, rej) => {
    jwt.verify(accessToken, process.env.JWT_SECRET!, (err, originalPayload) => {
      if (err) rej(err);
      else res(originalPayload as TokenPayload);
    });
  });
