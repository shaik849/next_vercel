import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // Ensure prisma is imported correctly
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { name, email, password } = req.body; // ✅ Read body directly

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // Default role
      },
    });

    return res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
