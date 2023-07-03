import { Request, Response } from "express";
import { UserModel } from "../../models/user/User";

export const getRandomUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.aggregate([
      {
        $sample: { size: 6 },
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
