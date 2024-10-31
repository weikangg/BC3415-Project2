// app/api/sessions/[sessionId]/documents/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// GET /api/sessions/:sessionId/documents - Retrieve documents for a session
export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params;

    // Query documents where sessionId matches the requested sessionId
    const documentsRef = collection(db, "documents");
    const q = query(documentsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    // Map through documents and prepare the response
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents for session:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
