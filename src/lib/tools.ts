import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import UsersModel from "../api/users/model";
import { ObjectId } from "mongoose";
import { UserDocument } from "../api/users/types";

export interface TokenPayload {
  _id: ObjectId;
}

export const createAccessToken = (payload: TokenPayload): Promise<string> =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "15 minute" },
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

export const createAccessRefreshToken = (
  payload: TokenPayload
): Promise<string> =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET!,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        else res(token as string);
      }
    )
  );

export const verifyAccessRefreshToken = (
  accessToken: string
): Promise<TokenPayload> =>
  new Promise((res, rej) => {
    jwt.verify(
      accessToken,
      process.env.REFRESH_SECRET!,
      (err, originalPayload) => {
        if (err) rej(err);
        else res(originalPayload as TokenPayload);
      }
    );
  });

export const createTokens = async (user: UserDocument) => {
  const accessToken = await createAccessToken({
    _id: user._id,
  });

  const refreshToken = await createAccessRefreshToken({ _id: user._id });

  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken };
};

export const verifyRefreshAndCreateNewTokens = async (
  currentRefreshToken: string
) => {
  try {
    const refreshTokenPayload = await verifyAccessRefreshToken(
      currentRefreshToken
    );

    const user = await UsersModel.findById(refreshTokenPayload._id);

    if (!user)
      throw createHttpError(
        404,
        `User with id ${refreshTokenPayload._id} not found!`
      );
    if (user.refreshToken && user.refreshToken === currentRefreshToken) {
      const { accessToken, refreshToken } = await createTokens(user);
      return { accessToken, refreshToken };
    } else {
      throw createHttpError(401, "Refresh token not valid!");
    }
  } catch (error) {
    console.log(error);
    throw createHttpError(401, "Refresh token not valid!!!");
  }
};
