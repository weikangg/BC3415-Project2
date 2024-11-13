"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Document, Page, pdfjs } from "react-pdf";

// Define the type for each file
type File = {
    name: string;
    type: string;
    url: string; // URL for files to display or link to the file content
};

// Define the type for each folder
type Folder = {
    id: string;
    name: string;
    date: string;
    files: File[]; // Each file, such as PDF, doc, etc.
};

const FolderDetail = () => {
    const params = useParams();
    const id = params.id; // Access the folder ID from the route params
    const [folder, setFolder] = useState<Folder | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null); // Track number of pages for the PDF

    useEffect(() => {
        if (!id) return;

        // Function to fetch folder data by ID from Firestore
        const fetchFolderData = async () => {
            try {
                const folderRef = doc(db, "folders", id as string);
                const folderDoc = await getDoc(folderRef);

                if (folderDoc.exists()) {
                    const folderData = folderDoc.data() as Folder;
                    setFolder(folderData);
                } else {
                    console.error("Folder not found");
                }
            } catch (error) {
                console.error("Error fetching folder data:", error);
            }
        };

        fetchFolderData();
    }, [id]);

    // Callback for successful PDF load, to retrieve total pages
    function onDocumentLoadSuccess({
        numPages: loadedPages,
    }: {
        numPages: number;
    }) {
        setNumPages(loadedPages);
    }

    if (!folder) return <p>Loading...</p>;

    // Find the first PDF file in folder.files
    const pdfFile = folder.files.find((file) => file.type === "pdf");

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{folder.name}</h1>
            <p>Date Created: {folder.date}</p>

            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Page Number</th>
                        <th className="py-2 px-4 border-b">Preview</th>
                    </tr>
                </thead>
                <tbody>
                    {pdfFile ? (
                        <Document
                            file={pdfFile.url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading="Loading PDF..."
                        >
                            {numPages &&
                                Array.from({ length: numPages }, (_, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="py-2 px-4 text-center">
                                            Page {index + 1}
                                        </td>
                                        <td className="py-2 px-4">
                                            <Page
                                                pageNumber={index + 1}
                                                width={300}
                                            />
                                        </td>
                                    </tr>
                                ))}
                        </Document>
                    ) : (
                        <tr>
                            <td colSpan={2} className="py-2 px-4 text-center">
                                No PDF available or loading...
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FolderDetail;
