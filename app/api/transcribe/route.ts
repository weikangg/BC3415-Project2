import { NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import FormData from "form-data";
import fetch from "node-fetch";
import OpenAI from "openai";

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIResponse {
  text: string;
}

// Helper function to transcribe audio using OpenAI API
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "audio.wav",
    contentType: "audio/wav",
  });
  formData.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
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

// Helper function to ensure English translation using GPT-4
async function translateToEnglish(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Translate the following text to English.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return completion?.choices[0]?.message?.content || "";
}

// POST /api/transcribe - Transcribe Audio and Update Transcription
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const pageNumber = Number(formData.get("pageNumber"));
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File) || !documentId || !pageNumber) {
      return NextResponse.json(
        { error: "File, documentId, and pageNumber are required" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const audioBuffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Transcribe the audio
    let transcription = await transcribeAudio(audioBuffer);

    // Step 2: Translate to English if necessary
    transcription = await translateToEnglish(transcription);

    // Fetch the existing document to retrieve the pages array
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

    // Update the transcription for the specific page
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
