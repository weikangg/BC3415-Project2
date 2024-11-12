import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { OpenAI } from "openai";
import FormData from "form-data";
import fetch from "node-fetch";

interface OpenAIResponse {
  text: string;
}

// Helper function to transcribe audio using OpenAI API
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "audio.wav", // Set a filename (required)
    contentType: "audio/wav", // Adjust the MIME type to match your audio format
  });
  formData.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(), // Necessary to include FormData headers
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to transcribe audio: ${await response.text()}`);
  }

  const result = (await response.json()) as OpenAIResponse;
  return result.text || "Transcription failed";
}

// POST /api/transcribe - Transcribe Audio and Save Transcription
// POST /api/transcribe - Transcribe Audio and Update Transcription
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const pageNumber = Number(formData.get("pageNumber"));
    const file = formData.get("file") as File;
    console.log("documentId", documentId);
    console.log("pageNumber", pageNumber);

    if (!file || !(file instanceof File) || !documentId || !pageNumber) {
      return NextResponse.json(
        { error: "File, documentId, and pageNumber are required" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const audioBuffer = Buffer.from(await file.arrayBuffer());

    // Transcribe audio
    const transcription = await transcribeAudio(audioBuffer);

    // Fetch the existing document to retrieve the pages array
    const documentRef = doc(db, "documents", documentId);
    const documentSnap = await getDoc(documentRef);

    if (!documentSnap.exists()) {
      console.error(`Document with ID ${documentId} not found in Firestore.`);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const documentData = documentSnap.data();
    const pages = documentData.pages || [];

    // Find and update the page with the matching pageNumber
    const updatedPages = pages.map((page: any) => {
      if (page.pageNumber === pageNumber) {
        return { ...page, transcription }; // Update transcription for the matching page
      }
      return page; // Keep the other pages unchanged
    });

    // Save the updated pages array back to Firestore
    await updateDoc(documentRef, { pages: updatedPages });

    return NextResponse.json({
      documentId,
      pageNumber,
      transcription,
    });
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 400 }
    );
  }
}
