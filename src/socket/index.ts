import mongoose, { ObjectId } from "mongoose";
import { Message } from "../api/chats/types";
import ChatsModel from "../api/chats/model";

interface Users {
  id: ObjectId;
  socketId: string;
  userName: string;
}

interface UsernameWithId {
  username: string;
  _id: ObjectId;
}

let OnlineUsers: Users[] = [];

export const newConnectionHandler = (newUser: any) => {
  console.log("SocketId: ", newUser.id);

  newUser.on("connectReceiveInfo", (payload: UsernameWithId) => {
    OnlineUsers.push({
      id: payload._id,
      socketId: newUser.id,
      userName: payload.username,
    });
    console.log("Current online users", OnlineUsers);

    newUser.emit("signedIn", OnlineUsers);
    newUser.broadcast.emit("newConnection", OnlineUsers);

    newUser.on("checkChats", async (payload: string[]) => {
      try {
        console.log(payload);
        const objectIdArray = payload.map((stringId) => {
          return new mongoose.Types.ObjectId(stringId);
        });
        console.log(objectIdArray);

        const chats = await ChatsModel.find();

        let chat = null;

        const checkIfValuesMatch = (arr1: any[], arr2: any[]) => {
          let count = 0;
          for (let i = 0; i < arr1.length; i++) {
            for (let z = 0; z < arr2.length; z++) {
              if (arr1[i] === arr2[z].toString()) {
                count++;
                break;
              }
            }
          }
          if (count !== arr1.length) return false;
          return true;
        };

        for (let v = 0; v < chats.length; v++) {
          if (checkIfValuesMatch(payload, chats[v].members)) {
            chat = chats[v];
          }
        }

        if (chat) {
          newUser.emit("existingChat", chat._id);
          console.log("Found a chat");
        } else {
          newUser.emit("noExistingChat");
          console.log("Found no chats");
        }
      } catch (error) {
        console.log(error);
        newUser.emit("errorCheckingChats", error);
      }
    });

    newUser.on("openChat", (payload: string) => {
      const roomId: string = payload;

      const messages: Message[] = [];

      newUser.join(roomId);

      newUser.on("sendMessage", async (message: Message) => {
        const chat = await ChatsModel.findByIdAndUpdate(roomId, {
          $push: { messages: message },
        });

        newUser.to(roomId).emit("newMessage", message);
      });

      newUser.on("disconnect", () => {
        const newOnlineUsers = OnlineUsers.filter((user) => {
          user.socketId !== newUser.id;
        });
        newUser.emit("newConnection", newOnlineUsers);
      });
    });
  });
};
