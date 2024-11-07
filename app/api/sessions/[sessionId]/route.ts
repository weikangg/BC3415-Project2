// app/api/sessions/[sessionId]/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// GET /api/sessions/:sessionId - Retrieve session details
export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params;

    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ id: sessionSnap.id, ...sessionSnap.data() });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
