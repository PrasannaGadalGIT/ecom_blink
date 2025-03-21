import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  _: Request,
  { params }: { params: { userId: string; productName: string } }
) {
  try {
    console.log(params.userId, params.productName);
    const userId = parseInt(params.userId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const { productName } = params;

    // Delete the item from the cart
    await prisma.cart.deleteMany({
      where: {
        userId,
        productName,
      },
    });

    return NextResponse.json(
      { message: "Item removed from cart" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}