import mongoose from "mongoose";
import { UserType } from "../../types/UserData";

const UserSchema = new mongoose.Schema<UserType>(
  {
    sub: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      index: "text",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    picture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model("user", UserSchema);
