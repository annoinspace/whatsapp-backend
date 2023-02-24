import mongoose, { ObjectId } from "mongoose"
import { Message } from "../api/chats/types"
import ChatsModel from "../api/chats/model"

interface Users {
  id: ObjectId
  socketId: string
  userName: string
}

interface UsernameWithId {
  username: string
  _id: ObjectId
}

let OnlineUsers: Users[] = []

export const newConnectionHandler = (newUser: any) => {
  console.log("SocketId: ", newUser.id)

  newUser.emit("welcome", { message: `Hello ${newUser.id}` })
  newUser.emit("socketId", newUser.id)

  newUser.on("connectReceiveInfo", (payload: UsernameWithId) => {
    OnlineUsers.push({
      id: payload._id,
      socketId: newUser.id,
      userName: payload.username
    })
    console.log("connectReceiveInfo---------------->", payload)
    console.log("Current online users", OnlineUsers)

    newUser.emit("signedIn", OnlineUsers)
    newUser.broadcast.emit("newConnection", OnlineUsers)

    newUser.on("checkChats", async (userIds: string[]) => {
      console.log("--------------------checkChats recieved------------------")
      try {
        const chat = await ChatsModel.findOne({ where: { members: { $in: userIds } } })
        console.log("the userId's ---------------------->", userIds)
        if (chat) {
          newUser.emit("existingChat", chat._id)
          console.log("Found a chat")
        } else {
          newUser.emit("noExistingChat")
          console.log("Found no chats")
          // const { _id } = await ChatsModel.create({  OnlineUsers })
          // console.log("chatroom created")
        }
      } catch (error) {
        console.log("!!!!!!!!!!!!!!!!!!!!!error", error)
        newUser.emit("errorCheckingChats", error)
      }
    })
    newUser.on("openChat", (payload: string) => {
      console.log("--------OpenChat--------:", payload)
      const roomId: string = payload

      const messages: Message[] = []

      newUser.join(roomId)
      console.log("roomId-------------->", roomId)

      newUser.on("sendMessage", async (message: Message) => {
        console.log("message received--------------->", message)
        const newMessage = {
          sender: message.sender,
          content: message.content,
          timeStamp: message.timestamp
        }
        const chat = await ChatsModel.findByIdAndUpdate(roomId, {
          $push: { messages: newMessage }
        })
        newUser.to(roomId).emit("newMessage", newMessage)
      })

      newUser.on("disconnect", () => {
        const newOnlineUsers = OnlineUsers.filter((user) => {
          user.socketId !== newUser.id
        })
        newUser.emit("newConnection", newOnlineUsers)
      })
    })
  })
}
