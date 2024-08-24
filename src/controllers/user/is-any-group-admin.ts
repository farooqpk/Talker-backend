import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const isAnyGroupAdmin = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        GroupAdmin: {
          some: {
            adminId: req.userId,
          },
        },
      },
      select: {
        name: true,
        GroupAdmin: {
          where: {
            adminId: {
              not: req.userId,
            },
          },
        },
      },
    });

    const doAllGroupsHaveRemainingAdmins = groups?.every(
      ({ GroupAdmin }) => GroupAdmin?.length > 0
    );

    const groupsHaveNoRemainingAdmins = groups
      ?.filter(({ GroupAdmin }) => GroupAdmin?.length === 0)
      ?.map(({ name }) => name)
      ?.join(", ");

    const status = {
      isAnyGroupAdmin: groups.length > 0,
      doAllGroupsHaveRemainingAdmins,
      groupsHaveNoRemainingAdmins,
    };

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json(error);
  }
};
