import { IncomingForm } from "formidable";
// import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const form = new IncomingForm({
    uploadDir: path.join(process.cwd(), "/public/uploads"),
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Failed to parse form" });
    }

    const { title, description, content } = fields;
    const image = files.image?.[0] || files.image;

    if (!title || !description || !content || !image) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const fileName = path.basename(image.filepath); // gets saved file name
    const imageUrl = `/uploads/${fileName}`;

    try {
      const newBlog = await prisma.blog.create({
        data: {
          title: String(title),
          description: String(description),
          content: String(content),
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
