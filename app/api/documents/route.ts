import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
import fetch from "node-fetch";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const uploadedFile = formData.get("file"); // Could be a URL or Blob
  const fileName = formData.get("name") as string;
  const fileType = formData.get("type") as string;
  const sessionId = formData.get("sessionId") as string;
  const uploadedBy = formData.get("uploadedBy") as string;

  let pagesContent: any = [];
  let fileUrl = "";

  if (typeof uploadedFile === "string") {
    fileUrl = uploadedFile;

    try {
      if (fileType === "pdf") {
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(`Failed to download file from URL: ${fileUrl}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        const pdfParser = new PDFParser();

        // Store the number of pages here
        let pageCount = 0;

        await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData) => {
            console.error("Error parsing PDF:", errData.parserError);
            reject(errData.parserError);
          });

          pdfParser.on("pdfParser_dataReady", (pdfData) => {
            // Get the number of pages
            pageCount = pdfData.Pages.length;
            console.log(`Total Pages in PDF: ${pageCount}`);
            // Create an array with empty summary and transcription for each page
            for (let i = 0; i < pageCount; i++) {
              pagesContent.push({
                pageNumber: i + 1,
                summary: "",
                transcription: "",
              });
            }

            resolve(null);
          });

          pdfParser.parseBuffer(buffer);
        });
      } else {
        console.log(`Skipping parsing for non-PDF file type: ${fileType}`);
      }
    } catch (error) {
      console.error("Error downloading or processing file from URL:", error);
      return NextResponse.json(
        { error: "Failed to download or process file" },
        { status: 500 }
      );
    }
  } else {
    console.error(
      "Invalid file format: file is neither a Blob nor a URL string"
    );
    return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
  }

  // Save document metadata in Firestore
  const docRef = await addDoc(collection(db, "documents"), {
    name: fileName,
    uploadedBy,
    sessionId,
    type: fileType,
    pages: pagesContent, // Array with empty summary and transcription fields
    url: fileUrl.toString(),
  });

  return NextResponse.json({ id: docRef.id });
}
