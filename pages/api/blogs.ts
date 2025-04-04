import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma"; // Ensure you have prisma setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const blogs = await prisma.blog.findMany({
      include: { author: true },
    });
    res.status(200).json({ blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
