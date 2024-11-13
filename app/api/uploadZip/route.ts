// app/api/uploadZip/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { db, storage } from "@/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

type File = {
    name: string;
    type: string;
    url: string;
};

type Folder = {
    name: string;
    date: string;
    files: File[];
    sessionId: string; // Include session ID in folder metadata
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        const content = await zip.loadAsync(arrayBuffer);

        const newFolders: Folder[] = [];
        const sessionPromises: Promise<void>[] = [];

        for (const [relativePath, zipEntry] of Object.entries(content.files)) {
            const pathParts = relativePath.split("/");
            const folderName = pathParts[1];
            const fileName = pathParts[2];

            if (!folderName || !fileName || zipEntry.dir) continue;

            let folder = newFolders.find((f: Folder) => f.name === folderName);

            if (!folder) {
                // Create a session for the folder
                const sessionData = {
                    title: folderName,
                    createdBy: "professor123", // Replace with actual user ID if available
                    createdAt: Timestamp.now(),
                    joinedUsers: ["professor123"],
                };

                // Add session creation to promises array
                const sessionPromise = addDoc(collection(db, "sessions"), sessionData)
                    .then((docRef) => {
                        const sessionId = docRef.id;
                        folder = {
                            name: folderName,
                            date: new Date().toLocaleDateString(),
                            files: [],
                            sessionId,
                        };
                        newFolders.push(folder);
                    });

                sessionPromises.push(sessionPromise);
                await sessionPromise; // Ensure folder is initialized before accessing it further
            }

            // Confirm `folder` is defined here after initialization
            if (folder) {
                const fileBuffer = await zipEntry.async("nodebuffer");
                const fileType = fileName.endsWith(".pdf") ? "pdf" : "word";
                const fileContentBase64 = fileBuffer.toString("base64");

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

                folder.files.push({
                    name: fileName,
                    type: fileType,
                    url: downloadURL,
                });
            }
        }

        // Wait for all sessions to be created
        await Promise.all(sessionPromises);

        // Save folders and files metadata to Firestore
        for (const folder of newFolders) {
            await addDoc(collection(db, "folders"), folder);
        }

        return NextResponse.json({
            message: "Upload and session creation successful",
            folders: newFolders,
        });
    } catch (error) {
        console.error("Error uploading zip and creating sessions:", error);
        return NextResponse.json(
            { error: "Failed to process zip file" },
            { status: 500 }
        );
    }
}
