import express from "express"
import UsersModel from "../users/model"
import { JwtAuthenticationMiddleware, UserRequest } from "../../lib/jwtAuth"
import ChatsModel from "./model"
import createHttpError from "http-errors"

const chatsRouter = express.Router()

// CHATS

// // Create a chat with other participant(s)
// chatsRouter.post("/openChat", JwtAuthenticationMiddleware, async (req, res, next) => {
//   try {
//     const { userIds } = req.body
//     console.log("userIds")
//     // Check if a ChatsModel with the given userIds already exists
//     const existingChat = await ChatsModel.findOne({ members: { $all: userIds } })
//     if (existingChat) {
//       console.log("chatroom already exists")
//       // Return the existing ChatsModel's _id
//       res.status(200).send({ message: "chatroom already exists", chatroomId: existingChat._id })
//     } else {
//       // Creating a new ChatsModel with the array of ids
//       const { _id } = await ChatsModel.create({ userIds })
//       console.log("chatroom created")

//       // Add the new chatroom to the "chats" array for each user
//       for (let userId of userIds) {
//         await UsersModel.findByIdAndUpdate(userId, { $push: { chats: _id } })
//       }

//       res.status(201).send({ message: "chatroom created", chatroomId: _id })
//     }
//   } catch (error) {
//     console.log(error)
//     next(error)
//   }
// })

chatsRouter.post("/", JwtAuthenticationMiddleware, async (req, res, next) => {
  try {
    const newChat = new ChatsModel(req.body)
    const { _id } = await newChat.save()
    console.log("newChat")
    if (_id) {
      res.status(201).send(_id)
    } else {
      next(createHttpError(404, `the chat did not create`))
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

// GET all chats

chatsRouter.get("/", JwtAuthenticationMiddleware, async (req: UserRequest, res, next) => {
  try {
    const chats = await ChatsModel.find()
    res.send(chats)
  } catch (error) {
    next(error)
  }
})

// GET full message history for specific chat

chatsRouter.get("/:id", JwtAuthenticationMiddleware, async (req, res, next) => {
  try {
    const chat = await ChatsModel.findById(req.params.id).populate("members")
    console.log(chat)
    if (chat) {
      res.send(chat)
    } else {
      createHttpError(404, `chat with the id ${req.params.id} not found`)
    }
  } catch (error) {
    next(error)
  }
})

// check if chat exists
// chatsRouter.get(
//   "/:receiverId",
//   JwtAuthenticationMiddleware,
//   async (req: UserRequest, res, next) => {
//     try {
//       const chat = await ChatsModel.find({
//         members: { $all: [req.user?._id, req.params.receiverId] },
//       });
//       if (chat) {
//         res.send({ message: "this people have a chat between them" });
//       } else {
//         res.send({ message: "this people do not have chat between them" });
//       }
//     } catch (error) {
//       next(error);
//     }
//   }
// );

export default chatsRouter
