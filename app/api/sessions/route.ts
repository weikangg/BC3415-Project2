// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { SessionSchema } from "../../../helpers/schemas";

// POST /api/sessions - Create a new session
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate the input data
    await SessionSchema.validate(data);

    const { title, createdBy } = data;
    const sessionData = {
      title,
      createdBy,
      createdAt: Timestamp.now(),
      joinedUsers: [createdBy], // Initialize with the creator's ID
    };

    // Add the session to Firestore
    const docRef = await addDoc(collection(db, "sessions"), sessionData);

    return NextResponse.json({ id: docRef.id, ...sessionData });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: error.message || "Failed to create session" }, { status: 400 });
  }
}
