// app/api/documents/[documentId]/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// GET /api/documents/:documentId/pages - Retrieve all pagesmetadata for a document
export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentRef = doc(db, "documents", params.documentId);
    const docSnap = await getDoc(documentRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const documentData = docSnap.data();
    if (!documentData?.pages) {
      return NextResponse.json({ error: "No pages metadata found" }, { status: 404 });
    }

    return NextResponse.json({ pages: documentData.pages });
  } catch (error) {
    console.error("Error fetching pages metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages metadata" },
      { status: 500 }
    );
  }
}
