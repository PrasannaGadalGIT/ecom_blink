// File: src/app/api/prisma/chats/[userId]/responses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
interface Resposne {
  description: string;
  imageURL : string;
  price: number;
  productName: string
}
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { chatId, responses } = body;

 
    if (!chatId || isNaN(parseInt(chatId))) {
      return NextResponse.json({ error: "Invalid or missing chat ID" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

   
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: "No response found!!!" }, { status: 400 });
    }

  
    const createdResponses = await prisma.$transaction(
      responses.map((item: Resposne) =>
        prisma.response.create({
          data: {
            description: item.description || "",
            imageURL: item.imageURL || "",
            price: (item.price || 0),
            productName: item.productName || "",
            chatId: parseInt(chatId),
          },
        })
      )
    );

    return NextResponse.json(
      { message: "Responses added successfully", responses: createdResponses },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding responses:", error);
    return NextResponse.json(
      { error: "Failed to add responses" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}