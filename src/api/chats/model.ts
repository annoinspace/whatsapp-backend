import mongoose from "mongoose";
import { Chat, ChatsDocument, ChatsModel, Message } from "./types";

const { Schema, model } = mongoose;

const MessageSchema = new Schema(
  {
    sender: { type: String, required: true },
    content: {
      text: { type: String, required: false },
      media: { type: String, required: false },
    },
    timestamp: { type: String, required: false },
  },
  {
    timestamps: false,
  }
);

const ChatSchema = new Schema(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [MessageSchema],
  },
  {
    timestamps: false,
  }
);

export default model<ChatsDocument, ChatsModel>("Chat", ChatSchema);
