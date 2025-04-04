import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // Import authOptions
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    console.log("Session data:", session.user); // Debugging session

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, image, description, content } = req.body;

    if (!title || !image || !description || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newBlog = await prisma.blog.create({
      data: { 
        title, 
        image, 
        description, 
        content, 
        authorId: session.user.id, // Use session user ID
      },
    });

    return res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error adding blog:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
