// app/api/sessions/[sessionId]/join/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

// POST /api/sessions/:sessionId/join - Allow user to join a session
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params;
    const { userId } = await request.json();

    // Update the session's joinedUsers array with the new user ID
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      joinedUsers: arrayUnion(userId), // Add the userId to the joinedUsers array
    });

    return NextResponse.json({ message: "User joined session successfully" });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}
