import { Request, Response } from "express";
import { UserModel } from "../../models/user/User";
import mongoose from "mongoose";

export const searchUser = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId); // we wont show the user who search
    const searchQuery = req.query.userName;
    if (searchQuery !== "") {
      const users = await UserModel.find(
        {
          _id: { $ne: userId },
          name: { $regex: searchQuery, $options: "i" },
        },
        { email: 0, sub: 0, createdAt: 0, updatedAt: 0, __v: 0 }
      );

      if (users !== null && users.length > 0) {
        res.status(200).json(users);
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } else {
      res
        .status(400)
        .json({ success: false, message: "search query should not be empty" });
    }
  } catch (error) {
    console.error("Error while searching user:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error while searching user" });
  }
};
