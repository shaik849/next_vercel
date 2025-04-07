import { IncomingForm } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import cloudinary from "@/lib/cloudinary";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") return res.status(401).json({ error: "Unauthorized" });

  const form = new IncomingForm({ keepExtensions: true });
  
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Failed to parse form" });

    const { title, description, content } = fields;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!title || !description || !content || !imageFile || !imageFile.filepath) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const result = await cloudinary.uploader.upload(imageFile.filepath, {
        folder: "blogs",
      });

      const newBlog = await prisma.blog.create({
        data: {
          title: String(title),
          description: String(description),
          content: String(content),
          image: result.secure_url,
          authorId: session.user.id,
        },
      });

      return res.status(201).json(newBlog);
    } catch (e) {
      console.error("Upload or DB Error:", e);
      return res.status(500).json({ error: "Upload failed" });
    } finally {
      fs.unlinkSync(imageFile.filepath); // Clean up temp file
    }
  });
}
