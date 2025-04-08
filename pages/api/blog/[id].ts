import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  switch (method) {
    case "PUT": {
      const { title, content } = req.body;
      try {
        const updatedBlog = await prisma.blog.update({
          where: { id: String(id) },
          data: {
            title,
            content,
          },
        });

        res.status(200).json(updated);
      } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Failed to update blog" });
      }
    }

    case "DELETE": {
      try {
        const blog = await prisma.blog.findUnique({ where: { id: String(id) } });
        if (!blog) return res.status(404).json({ error: "Blog not found" });

        // Delete the image file
        const imagePath = path.join(process.cwd(), "public", blog.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        // Delete the blog from DB
        await prisma.blog.delete({ where: { id: String(id) } });

        return res.status(200).json({ message: "Blog and image deleted" });
      } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Failed to delete blog" });
      }
    }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
