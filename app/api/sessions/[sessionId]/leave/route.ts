// app/api/sessions/[sessionId]/leave/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";

// DELETE /api/sessions/:sessionId/leave - Remove user from session
export async function DELETE(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Reference the session document
    const sessionRef = doc(db, "sessions", sessionId);

    // Remove the userId from the joinedUsers array
    await updateDoc(sessionRef, {
      joinedUsers: arrayRemove(userId),
    });

    return NextResponse.json({ message: "User successfully removed from session" });
  } catch (error) {
    console.error("Error exiting session:", error);
    return NextResponse.json({ error: "Failed to exit session" }, { status: 500 });
  }
}
