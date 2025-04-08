// pages/api/blog/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import formidable from "formidable";
import { prisma } from "../../../lib/prisma";
import fs from "fs";
import path from "path";

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const blogId = req.query.id as string;

  if (req.method === "PUT") {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
  
    const form = formidable({
      uploadDir,
      keepExtensions: true,
    });
  
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Error parsing form data" });
  
      const { title, content } = fields;
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
  
      try {
        const existingBlog = await prisma.blog.findUnique({ where: { id: blogId } });
        if (!existingBlog) return res.status(404).json({ error: "Blog not found" });
  
        let imagePath = existingBlog.image;
  
        if (file && file.filepath) {
          // Delete old image
          if (existingBlog.image && existingBlog.image.startsWith("/uploads/")) {
            const oldImagePath = path.join(process.cwd(), "public", existingBlog.image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
  
          // Save new image path
          imagePath = `/uploads/${path.basename(file.filepath)}`;
        }
  
        const updated = await prisma.blog.update({
          where: { id: blogId },
          data: {
            title: String(title),
            content: String(content),
            image: imagePath,
          },
        });
  
        res.status(200).json(updated);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update blog" });
      }
    });
  }
  

  else if (req.method === "DELETE") {
    try {
      const blog = await prisma.blog.findUnique({ where: { id: blogId } });

      if (blog?.image && blog.image.startsWith("/uploads/")) {
        const imagePath = path.join(process.cwd(), "public", blog.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await prisma.blog.delete({ where: { id: blogId } });
      res.status(200).json({ message: "Blog deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog" + error });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
