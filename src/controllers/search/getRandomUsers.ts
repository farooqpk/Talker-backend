import { Request, Response } from "express";
import { UserModel } from "../../models/user/User";
import mongoose from "mongoose";

export const getRandomUsers = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const users = await UserModel.aggregate([
      {
        $match: { _id: { $ne: userId } },
      },
      {
        // $sample is used to access random docs
        $sample: { size: 5 },
      },
      {
        $project: { email: 0, sub: 0, createdAt: 0, updatedAt: 0 },
      },
    ]);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching users",
    });
  }
};
