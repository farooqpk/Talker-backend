import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../../config";
import { prisma } from "../../utils/prisma";
import { AiChatRole } from "@prisma/client";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export const aiChat = async (req: Request, res: Response) => {
  try {
    const message = req.body?.message;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const history = await prisma.aiChatHistory.findMany({
      where: {
        userId,
      },
      select: {
        content: true,
        role: true,
      },
    });

    const chat = model.startChat({
      history: history?.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      }),
    });

    const result = await chat.sendMessage(message);

    const response = result?.response.text();

    if (!response) {
      return res.status(500).json({
        message: "Failed to get response from AI model",
      });
    }

    const newHistories = [
      { role: AiChatRole.user, content: message, userId },
      { role: AiChatRole.model, content: response, userId },
    ];

    await prisma.aiChatHistory.createMany({
      data: newHistories,
    });

    return res.status(200).json({ message: response });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
};
