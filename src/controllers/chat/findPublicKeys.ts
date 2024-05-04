import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const findPublicKeys = async (req: Request, res: Response) => {
  const members = req.body;
  try {
    const publicKeys = await Promise.all(
      members.map(async (member: any) => {
        const user = await prisma.user.findUnique({
          where: {
            userId: member,
          },
          select: {
            publicKey: true,
          },
        });

        return {
          userId: member,
          publicKey: user?.publicKey,
        };
      })
    );
    res.status(200).json(publicKeys);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
