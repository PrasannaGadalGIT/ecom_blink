
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body as RegisterRequestBody;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashpassword,
      },
    });

    // Debug logging
    console.log('Created user:', user);
    
    // Create payload and verify it's not null
    const payload = { id: user.id, email: user.email };
    console.log('Token payload before createToken:', payload);
    
  
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });
    
    return NextResponse.json({ msg: "User registered", token });
  } catch (error) {

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' }, 
      { status: 500 }
    );
  }
}