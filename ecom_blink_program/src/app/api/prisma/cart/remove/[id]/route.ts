import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  context: { params: { id: string } } // Corrected the type
) {
  try {
    const id = context.params.id; // Extract id properly
    const parsedId = parseInt(id, 10);

    // Validate id
    if (isNaN(parsedId)) {
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    // Delete the item from the cart
    await prisma.cart.delete({
      where: { id: parsedId }, // Ensure `id` is a number if your DB uses integers
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
