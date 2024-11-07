import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";

// POST /api/documents - Upload Document and parse PDF content
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const uploadedFiles = formData.getAll("file");

  let fileName = "";
  let pagesContent: any = [];

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[0];

    // Check if uploadedFile is of type File
    if (uploadedFile instanceof File) {
      // Generate a unique filename
      fileName = uuidv4();
      const tempFilePath = `/tmp/${fileName}.pdf`;

      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      // Initialize pdf2json parser
      const pdfParser = new (PDFParser as any)(null, 1);

      // Parse PDF and split by page breaks
      await new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: any) => {
          console.error("Error parsing PDF:", errData.parserError);
          reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", () => {
          const rawData = pdfParser.getRawTextContent();

          // Split the content by page breaks
          const pages = rawData.split(
            /----------------Page \(\d+\) Break----------------/
          );

          // Map each page to an object with pageNumber and content
          pages.forEach((pageContent: string, index: number) => {
            pagesContent.push({
              pageNumber: index + 1,
              content: pageContent.trim(),
              summary: "", // Empty summary placeholder
              transcription: "", // Empty transcription placeholder
            });
          });

          resolve(null);
        });

        pdfParser.loadPDF(tempFilePath);
      });

      // Delete the temporary file after parsing
      await fs.unlink(tempFilePath);
    } else {
      console.log("Uploaded file is not in the expected format.");
    }
  } else {
    console.log("No files found.");
  }

  // Save document metadata and pages content in Firestore
  try {
    const docRef = await addDoc(collection(db, "documents"), {
      name: fileName,
      uploadedBy: formData.get("uploadedBy"),
      sessionId: formData.get("sessionId"),
      pages: pagesContent,
    });

    return NextResponse.json({
      id: docRef.id,
      name: fileName,
      pages: pagesContent,
    });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}
