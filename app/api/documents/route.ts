// app/api/documents/route.ts
import { NextResponse } from "next/server";
import { db, storage } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DocumentSchema } from "../../../helpers/schemas";

// Helper function to upload file to Firebase Storage
async function uploadFileToStorage(file: File): Promise<string> {
  const storageRef = ref(storage, `documents/${file.name}-${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

// POST /api/documents - Upload Document
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const uploadedBy = formData.get("uploadedBy") as string;
    const sessionId = formData.get("sessionId") as string; // New field
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate the input data using the updated DocumentSchema
    await DocumentSchema.validate({ name, uploadedBy, sessionId, downloadURL: "" });

    // Upload file to Firebase Storage
    const downloadURL = await uploadFileToStorage(file);

    // Save document metadata to Firestore with sessionId
    const docRef = await addDoc(collection(db, "documents"), {
      name,
      uploadedBy,
      downloadURL,
      sessionId, // Include sessionId in Firestore document
    });

    return NextResponse.json({ id: docRef.id, name, uploadedBy, downloadURL, sessionId });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 400 });
  }
}
