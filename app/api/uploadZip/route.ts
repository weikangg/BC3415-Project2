// Define types for Folder and File
type File = {
    name: string;
    type: string;
    url: string;
};

type Folder = {
    name: string;
    date: string;
    files: File[];
};

// app/api/uploadZip/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { db, storage } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export async function POST(request: Request) {
    try {
        // Parse the incoming form data
        const formData = await request.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        // Convert the Blob to an ArrayBuffer, which JSZip can process
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        const content = await zip.loadAsync(arrayBuffer);

        // Define `newFolders` with an explicit type annotation
        const newFolders: Folder[] = [];

        // Group files by folder
        for (const [relativePath, zipEntry] of Object.entries(content.files)) {
            const pathParts = relativePath.split("/");
            const folderName = pathParts[1];
            const fileName = pathParts[2];

            // Skip if it's not a file or if it's a top-level directory
            if (!folderName || !fileName || zipEntry.dir) continue;

            // Find the folder, ensuring `folder` has the `Folder | undefined` type
            let folder = newFolders.find((f: Folder) => f.name === folderName);

            if (!folder) {
                folder = {
                    name: folderName,
                    date: new Date().toLocaleDateString(),
                    files: [],
                };
                newFolders.push(folder);
            }

            const fileBuffer = await zipEntry.async("nodebuffer"); // Get the file as a Buffer
            const fileType = fileName.endsWith(".pdf") ? "pdf" : "word";

            // Convert buffer to base64
            const fileContentBase64 = fileBuffer.toString("base64");

            // Upload file to Firebase Storage
            const storageRef = ref(
                storage,
                `folders/${folderName}/${fileName}`
            );
            const snapshot = await uploadString(
                storageRef,
                `data:application/octet-stream;base64,${fileContentBase64}`,
                "data_url"
            );
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Add file metadata to folder
            folder.files.push({
                name: fileName,
                type: fileType,
                url: downloadURL,
            });
        }

        // Save folders and files metadata to Firestore
        for (const folder of newFolders) {
            await addDoc(collection(db, "folders"), folder);
        }

        return NextResponse.json({
            message: "Upload successful",
            folders: newFolders,
        });
    } catch (error) {
        console.error("Error uploading zip:", error);
        return NextResponse.json(
            { error: "Failed to process zip file" },
            { status: 500 }
        );
    }
}
