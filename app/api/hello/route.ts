// /app/api/hello/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define the GET request handler
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello, world!" });
}

// Define the POST request handler
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: `Hello, ${body.name}!` });
}
