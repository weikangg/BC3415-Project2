"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Document, Page, pdfjs } from "react-pdf";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
    const [pdfBlob, setPdfBlob] = useState<string | null>(null); // Track the PDF blob URL

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

    // Fetch PDF blob when folder and PDF file exist
    useEffect(() => {
        const fetchPdfBlob = async () => {
            if (folder) {
                const pdfFile = folder.files.find(
                    (file) => file.type === "pdf"
                );
                if (pdfFile) {
                    try {
                        const response = await fetch(pdfFile.url);
                        const blob = await response.blob();
                        const blobURL = URL.createObjectURL(blob);
                        setPdfBlob(blobURL);
                    } catch (error) {
                        console.error("Error fetching PDF blob:", error);
                    }
                }
            }
        };

        fetchPdfBlob();
    }, [folder]);

    // Callback for successful PDF load, to retrieve total pages
    function onDocumentLoadSuccess({
        numPages: loadedPages,
    }: {
        numPages: number;
    }) {
        setNumPages(loadedPages);
    }

    if (!folder) return <p>Loading...</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{folder.name}</h1>
            <p>Date Created: {folder.date}</p>

            {pdfBlob ? (
                <Document
                    file={pdfBlob}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading="Loading PDF..."
                    onLoadError={(error) =>
                        console.error("Error loading PDF:", error)
                    }
                    className="border p-0 mx-auto" // Center Document and remove padding
                >
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Slides</th>
                                <th className="py-2 px-4 border-b">
                                    Recordings
                                </th>
                                <th className="py-2 px-4 border-b">Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {numPages &&
                                Array.from({ length: numPages }, (_, index) => (
                                    <tr key={index} className="border-b-5">
                                        <td className="py-2 px-4 text-center">
                                            <Page
                                                pageNumber={index + 1}
                                                width={500} // Adjust the width as needed
                                                renderAnnotationLayer={false} // Disable annotations
                                                renderTextLayer={false} // Disable text layer
                                                className="mx-auto w-1/3 border-b-5" // Center Page within cell
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-center w-1/3 border border-b-5">
                                            Add recording
                                        </td>
                                        <td className="py-2 px-4 text-center w-1/3 border border-b-5">
                                            Generating Notes..
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </Document>
            ) : (
                <p className="text-center">No PDF available or loading...</p>
            )}
        </div>
    );
};

export default FolderDetail;
