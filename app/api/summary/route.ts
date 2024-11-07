import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import fetch from "node-fetch";

// Helper function to generate summary using OpenAI API
async function generateSummary(
  content: string,
  transcription: string
): Promise<string> {
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant that summarizes text.",
    },
    {
      role: "user",
      content: `Please summarize this content: ${content} with this transcription: ${transcription}. If either transcription or content is not provided, just use whatever is provided. Provide a detailed summary.`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate summary: ${await response.text()}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || "Summary generation failed";
}

// POST /api/summarizePage - Generate summary for a document page
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const pageNumber = Number(formData.get("pageNumber"));

    if (!documentId || !pageNumber) {
      return NextResponse.json(
        { error: "documentId and pageNumber are required" },
        { status: 400 }
      );
    }

    // Fetch the document from Firestore
    const documentRef = doc(db, "documents", documentId);
    const documentSnap = await getDoc(documentRef);

    if (!documentSnap.exists()) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const documentData = documentSnap.data();
    const pages = documentData.pages || [];

    // Find the page with the matching pageNumber
    const page = pages.find((p: any) => p.pageNumber === pageNumber);
    if (!page) {
      return NextResponse.json(
        { error: `Page number ${pageNumber} not found in document` },
        { status: 404 }
      );
    }

    // Get content and transcription from the specified page
    const { content, transcription } = page;

    // Generate summary using OpenAI API
    const summary = await generateSummary(content, transcription);

    // Update the page with the generated summary
    const updatedPages = pages.map((p: any) =>
      p.pageNumber === pageNumber ? { ...p, summary } : p
    );

    // Save the updated pages array back to Firestore
    await updateDoc(documentRef, { pages: updatedPages });

    return NextResponse.json({
      documentId,
      pageNumber,
      summary,
    });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary" },
      { status: 400 }
    );
  }
}
