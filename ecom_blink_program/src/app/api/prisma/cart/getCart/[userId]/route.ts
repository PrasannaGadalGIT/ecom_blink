import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = parseInt( params.userId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId },
    });

    // Ensure cartItems is always an array
    return NextResponse.json(cartItems || [], { status: 200 });

  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
