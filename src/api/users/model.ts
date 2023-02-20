import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument, UsersModel } from "./types";

const { Schema, model } = mongoose;

const UsersSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    chats: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

UsersSchema.pre("save", async function (next) {
  const currentUser = this;
  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password;

    const hash = await bcrypt.hash(plainPW, 11);
    currentUser.password = hash;
  }

  next();
});

UsersSchema.methods.toJSON = function () {
  const userDocument = this;
  const user = userDocument.toObject();

  delete user.password;
  delete user.createdAt;
  delete user.updatedAt;
  delete user.__v;
  delete user.refreshToken;

  return user;
};

UsersSchema.static("checkCredentials", async function (email, plainPassword) {
  const user = await this.findOne({ email });

  if (user) {
    const isMatch = await bcrypt.compare(plainPassword, user.password);

    if (isMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model<UserDocument, UsersModel>("User", UsersSchema);
