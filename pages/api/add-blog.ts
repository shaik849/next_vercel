import { IncomingForm, File as FormidableFile, Files } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]"; // adjust path if needed

// Disable built-in body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), "/public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    multiples: false,
  });

  form.parse(req, async (err, fields, files: Files) => {
    if (err) {
      console.error("Formidable parse error:", err);
      return res.status(500).json({ error: "Failed to parse form" });
    }

    try {
      const { title, description, content } = fields;

      const blogTitle = Array.isArray(title) ? title[0] : title;
      const blogDescription = Array.isArray(description) ? description[0] : description;
      const blogContent = Array.isArray(content) ? content[0] : content;

      const imageField = files.image;
      const imageFile = Array.isArray(imageField)
        ? imageField[0]
        : (imageField as FormidableFile);

      if (!blogTitle || !blogDescription || !blogContent || !imageFile || !("filepath" in imageFile)) {
        return res.status(400).json({ error: "Missing required fields or image upload failed" });
      }

      const fileName = path.basename(imageFile.filepath);
      const imageUrl = `/uploads/${fileName}`;

      const newBlog = await prisma.blog.create({
        data: {
          title: blogTitle,
          description: blogDescription,
          content: blogContent,
          image: imageUrl,
          authorId: session.user.id,
        },
      });

      return res.status(201).json(newBlog);
    } catch (error) {
      console.error("Error saving blog:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
}
