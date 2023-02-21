import { Model } from "mongoose";
import { User } from "../users/types";

export interface Message {
  sender: string;
  content: {
    text?: string;
    media?: string;
  };
  timestamp: number;
}

export interface Chat {
  members: string[];
  messages: Message[];
}

export interface ChatsDocument extends Chat, Document {}

export interface ChatsModel extends Model<ChatsDocument> {}
