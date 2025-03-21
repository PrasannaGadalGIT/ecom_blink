import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Get the email from query params

    if (!userId) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Fetch the user by email (assuming email is unique)
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch chats for the user
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      include: {
        responses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Error fetching chats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
