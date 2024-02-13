// prismaClient.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectPrisma = async () => {
  await prisma.$connect();
  console.log("Prisma connected");
};

// Optional: Disconnect from the database on application exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { connectPrisma, prisma };
