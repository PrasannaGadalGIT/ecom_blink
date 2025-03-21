import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { userId, productName, imageURL, description, price, quantity } = body;

    if (!userId || !productName || !price) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if item already exists in the cart
    const existingItem = await prisma.cart.findFirst({
      where: { userId, productName },
    });

    if (existingItem) {
      // Update quantity if product already exists
      const updatedItem = await prisma.cart.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
      });

      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Add a new item to the cart
      const newCartItem = await prisma.cart.create({
        data: {
          userId,
          productName,
          imageURL,
          description,
          price,
          quantity: quantity || 1,
        },
      });

      return NextResponse.json(newCartItem, { status: 201 });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
