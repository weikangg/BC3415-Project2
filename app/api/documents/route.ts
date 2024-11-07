// app/api/documents/route.ts
import { NextResponse } from "next/server";
import { db, storage } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DocumentSchema } from "../../../helpers/schemas";

// Helper function to upload file to Firebase Storage
async function uploadFileToStorage(
    fileContent: string,
    fileName: string
): Promise<string> {
    // Decode base64 content if it starts with data URL scheme
    const base64Data = fileContent.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    const storageRef = ref(storage, `documents/${fileName}-${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, buffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

// POST /api/documents - Upload Document
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const uploadedBy = formData.get("uploadedBy") as string;
        const sessionId = formData.get("sessionId") as string;
        const fileContent = formData.get("file") as string; // Expecting base64 string
        const fileName = formData.get("fileName") as string; // Add field for file name

        if (!name || !uploadedBy || !sessionId || !fileContent || !fileName) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate the input data using the DocumentSchema
        await DocumentSchema.validate({ name, uploadedBy, sessionId });

        // Upload file to Firebase Storage
        const downloadURL = await uploadFileToStorage(fileContent, fileName);

        // Save document metadata to Firestore with sessionId
        const docRef = await addDoc(collection(db, "documents"), {
            name,
            uploadedBy,
            downloadURL,
            sessionId,
        });

        return NextResponse.json({
            id: docRef.id,
            name,
            uploadedBy,
            downloadURL,
            sessionId,
        });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload document" },
            { status: 400 }
        );
    }
}
