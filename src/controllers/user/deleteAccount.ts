import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.userId;

  // try {
  //   await prisma.$transaction(async (tx) => {
  //     await tx.message.deleteMany({
  //       where: {
  //         senderId: userId,
  //       },
  //     });

  //     await tx.participants.deleteMany({
  //       where: {
  //         userId,
  //       },
  //     });

  //     await tx.chatKey.deleteMany({
  //       where: {
  //         userId,
  //       },
  //     });
  //   });
  // } catch (error) {
  //   res.status(500).json(error);
  // }
};
