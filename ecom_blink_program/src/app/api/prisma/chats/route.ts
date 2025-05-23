import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
interface Resposne {
  description: string;
  image_url : string;
  price: number;
  title: string
  url: string;
}
// GET - Fetch chats (with optional filtering by userId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
   
    if (userId) {
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum)) {
        return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
      }
      
      const chats = await prisma.chat.findMany({
        where: { userId: userIdNum },
        include: {
          responses: true, 
        },
        orderBy: {
          id: 'desc', 
        },
      });
      
      return NextResponse.json(chats, { status: 200 });
    }
    
  
    const chats = await prisma.chat.findMany({
      include: {
        responses: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
    
    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error("Error fetching chats:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body= await request.json();
    
  
    
    
    // Validate required fields
    if (!body || !body.query || !body.userId) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        requiredFields: ["query", "userId"] 
      }, { status: 400 });
    }
    
    // Verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create the chat
    const newChat = await prisma.chat.create({
      data: {
        query: body.query,
        userId: body.userId,
        responses: body.responses ? {
          create: body.responses.map((resp: Resposne) => ({
            description: resp.description,
            image_url: resp.image_url,
            price: resp.price,
            title: resp.title,
            url:resp.url
            
          }))
        } : undefined
      },
      
      include: {
        responses: true,
      },
    });
    
    return NextResponse.json({
      message: "Chat created successfully",
      chat: newChat
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}