import mongoose from "mongoose";

interface UserType {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

const UserSchema = new mongoose.Schema<UserType>({
  sub: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  picture: {
    type: String,
  },
});

export const UserModel = mongoose.model("user",UserSchema)