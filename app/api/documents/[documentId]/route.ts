// app/api/documents/[documentId]/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// GET /api/documents/:documentId - Retrieve document details
export async function GET(request: Request, { params }: { params: { documentId: string } }) {
  try {
    const documentRef = doc(db, "documents", params.documentId);
    const docSnap = await getDoc(documentRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
