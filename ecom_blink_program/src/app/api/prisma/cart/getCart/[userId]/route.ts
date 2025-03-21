import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Extract userId from the URL
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop() || ""; // Get the last segment of the URL

    // Convert userId to a number
    const userIdNumber = parseInt(userId, 10);

    // Validate userId
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // Fetch cart items for the user
    const cartItems = await prisma.cart.findMany({
      where: { userId: userIdNumber },
    });

    // Ensure cartItems is always an array
    return NextResponse.json(cartItems || [], { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}