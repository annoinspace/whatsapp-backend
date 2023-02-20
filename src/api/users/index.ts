import express from "express";
import createHttpError from "http-errors";
import { JwtAuthenticationMiddleware, UserRequest } from "../../lib/jwtAuth";
import UsersModel from "./model";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { createTokens, verifyRefreshAndCreateNewTokens } from "../../lib/tools";

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("userProfilePic");

const usersRouter = express.Router();

// GET USERS (EITHER ALL OF THEM OR BY EMAIL / USERNAME IF QUERY PARAMS USED)
usersRouter.get("/", JwtAuthenticationMiddleware, async (req, res, next) => {
  try {
    let users;
    if (req.query.search) {
      users = await UsersModel.find({
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      });
    } else {
      users = await UsersModel.find();
    }

    if (users) {
      res.status(200).send(users);
    } else {
      next(createHttpError(404, "No users were found."));
    }
  } catch (error) {
    next(error);
  }
});

// GET ME

usersRouter.get(
  "/me",
  JwtAuthenticationMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (req.user) {
        const me = await UsersModel.findById(req.user._id);
        if (me) {
          res.send(me);
        }
      } else {
        createHttpError(404, "user not found");
      }
    } catch (error) {
      next(error);
    }
  }
);

// EDIT ME

usersRouter.put(
  "/me",
  JwtAuthenticationMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (req.user) {
        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.user._id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );
        res.send(updatedUser);
      }
    } catch (error) {
      next(error);
    }
  }
);

// CHANGE MY AVATAR

usersRouter.post(
  "/me/avatar",
  JwtAuthenticationMiddleware,
  cloudinaryUploader,
  async (req: UserRequest, res, next) => {
    try {
      if (req.user) {
        const foundUser = await UsersModel.findByIdAndUpdate(
          req.user._id,
          { avatar: req.file!.path },
          { new: true, runValidators: true }
        );
        res.status(201).send({ message: "User Pic Uploaded" });
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET SPECIFIC USER

usersRouter.get(
  "/:userId",
  JwtAuthenticationMiddleware,
  async (req, res, next) => {
    try {
      const foundUser = await UsersModel.findById(req.params.userId);
      if (foundUser) {
        res.status(200).send(foundUser);
      } else {
        createHttpError(404, `user with id ${req.params.userId} not found `);
      }
    } catch (error) {
      next(error);
    }
  }
);

// REGISTER USER

usersRouter.post("/account", async (req, res, next) => {
  try {
    const newUserPre = {
      ...req.body,
      avatar: `https://ui-avatars.com/api/?name=${req.body.username}`,
    };

    const newUser = new UsersModel(newUserPre);
    const { _id } = await newUser.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// LOGIN USER

usersRouter.post("/session", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      const { accessToken, refreshToken } = await createTokens(user);
      res.send({ accessToken, refreshToken, user });
    } else {
      next(createHttpError(401, `Credentials are not valid.`));
    }
  } catch (error) {
    next(error);
  }
});

// LOGOUT USER

usersRouter.delete(
  "/session",
  JwtAuthenticationMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (req.user) {
        const user = await UsersModel.updateOne(
          { id: req.user._id },
          { $unset: { refreshToken: 1 } }
        );

        if (user) {
          res.status(200).send({ message: "User logged out" });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

// REFRESH USER SESSION/TOKENS

usersRouter.post("/refreshTokens", async (req, res, next) => {
  try {
    const { currentRefreshToken } = req.body;
    const newTokens = await verifyRefreshAndCreateNewTokens(
      currentRefreshToken
    )!;

    res.send({ ...newTokens });
  } catch (error) {
    next(error);
  }
});

export default usersRouter;
