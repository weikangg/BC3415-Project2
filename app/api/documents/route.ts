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

// Function to simulate pages data TODO: Change
function generatePagesData(
  pageCount: number
): { pageNumber: number; transcription: string; summary: string }[] {
  const pages = [];
  for (let i = 1; i <= pageCount; i++) {
    pages.push({
      pageNumber: i,
      transcription: `Sample transcription text for page ${i}`, // Simulated transcription
      summary: `Sample summary for page ${i}`, // Simulated summary
      content:
        "Recursion in programming is a technique where a function calls itself directly or indirectly in order to solve a problem. A recursive function generally has two main parts: \n\n1. **Base Case**: This is the condition under which the recursive function stops calling itself. It is essential to prevent infinite recursion and eventually terminate the process. The base case typically handles the simplest instance of the problem, often resolving immediately without further recursive calls.\n\n2. **Recursive Case**: This part of the function breaks down the problem into smaller, more manageable parts, calling itself with these reduced problems. Each recursive call should bring the process closer to the base case.\n\nRecursion is commonly used for tasks that can be defined in terms of similar subtasks, such as navigating tree structures, sorting algorithms (like quicksort and mergesort), and calculating mathematical sequences (like Fibonacci numbers). It often provides a more straightforward solution in terms of algorithm design and can lead to more readable code by expressing the same patterns more concisely compared to iterative approaches.\n\nHowever, excessive recursion depth can lead to stack overflow errors, as each recursive call consumes some portion of the program's stack space. Therefore, it's important to ensure that the base case can be reached and that optimizations such as tail recursion, if supported by the language, are used when applicable to mitigate such limitations.",
    });
  }
  return pages;
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
    await DocumentSchema.validate({ name, uploadedBy, sessionId });

    const pages = generatePagesData(2);

    // Upload file to Firebase Storage
    const downloadURL = await uploadFileToStorage(file);

    // Save document metadata to Firestore with sessionId
    const docRef = await addDoc(collection(db, "documents"), {
      name,
      uploadedBy,
      downloadURL,
      sessionId, // Include sessionId in Firestore document
      pages: pages,
    });

    return NextResponse.json({
      id: docRef.id,
      name,
      uploadedBy,
      downloadURL,
      sessionId,

      pages: pages,
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 400 }
    );
  }
}
