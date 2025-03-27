import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
 
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop() || ""; 

   
    const userIdNumber = parseInt(userId, 10);

    
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId: userIdNumber },
    });

   
    return NextResponse.json(cartItems || [], { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}