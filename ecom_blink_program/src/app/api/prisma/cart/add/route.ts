import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ZodError, z } from "zod";

const prisma = new PrismaClient();


export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    
    // Validate input
  
    const { userId, title, image_url, description, price, quantity } = body;

    // Check for existing item
    const existingItem = await prisma.cart.findFirst({
      where: { 
        userId, 
        productName: title 
      },
      select: {
        id: true,
        quantity: true
      }
    });

    // Transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      if (existingItem) {
        return await tx.cart.update({
          where: { id: existingItem.id },
          data: { 
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date() 
          },
        });
      } else {
        return await tx.cart.create({
          data: {
            userId,
            productName: title,
            image_url,
            description,
            price,
            quantity,
          },
        });
      }
    });

    return NextResponse.json(result, { 
      status: existingItem ? 200 : 201 
    });

  } catch (error) {
    console.error("Error in cart API:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

// Add GET endpoint to retrieve cart items
export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId'));

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { message: "Valid userId is required" },
        { status: 400 }
      );
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cartItems, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};