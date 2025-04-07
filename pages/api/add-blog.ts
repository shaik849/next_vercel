import { IncomingForm, File as FormidableFile, Files } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false, // Required for formidable to parse form-data
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

  const form = new IncomingForm({
    uploadDir: path.join(process.cwd(), "/public/uploads"),
    keepExtensions: true,
    multiples: false,
  });

  form.parse(req, async (err, fields, files: Files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Failed to parse form" });
    }

    const blogTitle = fields.title?.toString() || "";
    const blogDescription = fields.description?.toString() || "";
    const blogContent = fields.content?.toString() || "";

    const imageField = files.image;
    let imageFile: FormidableFile | undefined;

    if (Array.isArray(imageField)) {
      imageFile = imageField[0];
    } else if (imageField && "filepath" in imageField) {
      imageFile = imageField;
    }

    if (!blogTitle || !blogDescription || !blogContent || !imageFile || !("filepath" in imageFile)) {
      return res.status(400).json({ error: "Missing required fields or image upload failed" });
    }

    const fileName = path.basename(imageFile.filepath);
    const imageUrl = `/uploads/${fileName}`;

    try {
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
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Error saving to database" });
    }
  });
}
