// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const title = fields.title?.[0] || fields.title;
    const description = fields.description?.[0] || fields.description;
    const content = fields.content?.[0] || fields.content;

    const image = files.image;
    const imageFile = Array.isArray(image) ? image[0] : image;
    const imagePath = (imageFile as FormidableFile)?.filepath;

    if (!title || !description || !content || !imagePath) {
      return res.status(400).json({ error: "Missing required fields or image" });
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        folder: "blogs",
      });

      const blog = await prisma.blog.create({
        data: {
          title: String(title),
          description: String(description),
          content: String(content),
          image: uploadResult.secure_url,
          authorId: session.user.id,
        },
      });

      return res.status(201).json(blog);
    } catch (error) {
      console.error("Cloudinary/Prisma error:", error);
      return res.status(500).json({ error: "Failed to upload or save blog" });
    } finally {
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  });
}
