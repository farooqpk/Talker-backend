import { Request, Response } from "express";
import { GEMINI_API_KEY } from "../../config";
import { prisma } from "../../utils/prisma";
import { AiChatRole } from "@prisma/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-latest",
  apiKey: GEMINI_API_KEY!,
});

export const aiChat = async (req: Request, res: Response) => {
  try {
    const message = req.body?.message;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const history = await prisma.aiChatHistory.findMany({
      where: {
        userId,
      },
      select: {
        content: true,
        role: true,
      },
    });

    const formattedHistory = history
      .map(
        (msg) =>
          `${msg.role === AiChatRole.user ? "User" : "Assistant"}: ${
            msg.content
          }`
      )
      .join("\n");

    const prompt = PromptTemplate.fromTemplate(`
      I am Talker AI, an advanced AI assistant designed to be your helpful companion. I aim to make our interactions engaging and productive while maintaining these key characteristics:
      - Friendly and conversational, with a distinct personality
      - Clear and precise in my explanations
      - Solution-focused and practical
      - Understanding and responsive to your needs
      
      My core principles:
      - I maintain complete honesty about my capabilities and limitations
      - I break down complex topics into understandable concepts
      - I build on our conversation history to provide relevant responses
      - I focus on addressing your current needs while remembering our past interactions
      
      Previous conversation history:
      {history}
      
      Current user message: {message}
      
      Response as Talker AI, maintaining a consistent and engaging personality throughout our conversation.
      Assistant: `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const response = await chain.invoke({ history: formattedHistory, message });

    const newHistories = [
      { role: AiChatRole.user, content: message, userId },
      { role: AiChatRole.model, content: response, userId },
    ];

    await prisma.aiChatHistory.createMany({
      data: newHistories,
    });

    return res.status(200).json({ message: response });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
};
