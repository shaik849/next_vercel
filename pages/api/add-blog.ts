import { IncomingForm, File as FormidableFile } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import fs from "fs";
import { put } from "@vercel/blob";

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

  const form = new IncomingForm({ keepExtensions: true, multiples: false });

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
      // Upload image to Vercel Blob
      const stream = fs.createReadStream(imagePath);
      const upload = await put(`blog-images/${imageFile?.originalFilename}`, stream, {
        access: "public",
      });

      const imageUrl = upload.url;

      const newBlog = await prisma.blog.create({
        data: {
          title: title as string,
          description: description as string,
          content: content as string,
          image: imageUrl,
          authorId: session.user.id,
        },
      });

      return res.status(201).json(newBlog);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Error saving to database" });
    }
  });
}
