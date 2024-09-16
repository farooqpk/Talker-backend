import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectPrisma = async () => {
  await prisma.$connect();
  console.log("Prisma connected");
};

export { connectPrisma, prisma };
