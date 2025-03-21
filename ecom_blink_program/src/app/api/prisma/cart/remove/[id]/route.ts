import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } } // id is a string from the URL
) {
  try {
    const param = await params
    const id = await param.id
    const parsedId = parseInt(id, 10);

    // Validate id
    if (isNaN(parsedId)) {
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    // Delete the item from the cart
    await prisma.cart.delete({
      where: {
        id: parsedId, // Use the correct field name (id)
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