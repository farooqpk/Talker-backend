import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../../config";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export const aiChat = async (req: Request, res: Response) => {
  try {
    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const result = await model.generateContent(message);
    const response = result.response;
    const text = response.text();

    return res.status(200).json({ message: text });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while processing your request",
    });
  }
};
