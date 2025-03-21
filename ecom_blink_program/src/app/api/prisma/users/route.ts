import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request){
    try{
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        // If email is provided, filter users by email
        if (email) {
            const user = await prisma.user.findMany({
                where: { email: email }
            });
            
            return NextResponse.json(user, { status: 200 });
        }
        
        // If no email provided, return all users
        const users = await prisma.user.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch(error){
        console.error("Error fetching users: ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request){
    try{
        const body = await req.json().catch(() => null);
        
        if (!body || !body.email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email }
        });
        
        if (existingUser) {
            return NextResponse.json({ 
                message: "User already exists",
                user: existingUser
            }, { status: 200 });
        }
        
        const newUser = await prisma.user.create({
            data: {
                email: body.email,
                username: body.username || body.email.split('@')[0]
            }
        });

        return NextResponse.json({
            message: `User registered successfully: ${body.username || body.email}`,
            user: newUser
        }, { status: 201 });
    } catch(error){
        console.error("Error adding user:", error instanceof Error ? error.message : String(error));
        
        if (error instanceof Error && error.message.includes("Unique constraint failed")) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }
        
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}