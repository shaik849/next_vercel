// pages/api/blog/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import formidable from "formidable";
import { prisma } from "../../../lib/prisma";
import fs from "fs";
import { put, del } from "@vercel/blob";

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
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Error parsing form data" });

      const { title, content } = fields;
      const file = Array.isArray(files.image) ? files.image[0] : files.image;

      try {
        const existingBlog = await prisma.blog.findUnique({ where: { id: blogId } });
        if (!existingBlog) return res.status(404).json({ error: "Blog not found" });

        let imageUrl = existingBlog.image;

        // 🔥 Delete old image if it's a blob URL
        if (file && file.filepath && imageUrl?.startsWith("https://")) {
          const url = new URL(imageUrl);
          const pathname = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
          console.log("Deleting old image:", pathname);
          await del(pathname);
        }

        // 🔼 Upload new image
        if (file && file.filepath) {
          const stream = fs.createReadStream(file.filepath);
          const upload = await put(`blog-images/${file.originalFilename}`, stream, {
            access: "public",
          });

          imageUrl = upload.url;
        }

        const updated = await prisma.blog.update({
          where: { id: blogId },
          data: {
            title: String(title),
            content: String(content),
            image: imageUrl,
          },
        });

        res.status(200).json(updated);
      } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Failed to update blog" });
      }
    });
  }

  else if (req.method === "DELETE") {
    try {
      const blog = await prisma.blog.findUnique({ where: { id: blogId } });

      // 🔥 Delete image from Blob (if it's a blob URL)
      if (blog?.image?.startsWith("https://")) {
        const url = new URL(blog.image);
        const pathname = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
        // console.log("Deleting image on delete:", pathname);
        await del(pathname);
      }

      await prisma.blog.delete({ where: { id: blogId } });
      res.status(200).json({ message: "Blog deleted" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete blog" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
