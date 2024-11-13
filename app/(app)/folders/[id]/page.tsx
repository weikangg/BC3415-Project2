"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Document, Page, pdfjs } from "react-pdf";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Define the type for each file
type DocumentFile = {
    name: string;
    type: string;
    url: string; // URL for files to display or link to the file content
};

// Define the type for each folder
type Folder = {
    id: string;
    name: string;
    date: string;
    files: DocumentFile[]; // Each file, such as PDF, doc, etc.
    sessionId: string; // Session ID for the folder
};

const FolderDetail = () => {
    const params = useParams();
    const id = params.id; // Access the folder ID from the route params
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [folder, setFolder] = useState<Folder | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null); // Track number of pages for the PDF
    const [pdfBlob, setPdfBlob] = useState<string | null>(null); // Track the PDF blob URL
    const [recordings, setRecordings] = useState<{ [key: number]: string }>({});
    const [transcriptions, setTranscriptions] = useState<{
        [key: number]: string;
    }>({});
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [currentRecordingPage, setCurrentRecordingPage] = useState<
        number | null
    >(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (!id) return;

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

    useEffect(() => {
        const fetchPdfBlob = async () => {
            if (folder) {
                const pdfFile = folder.files.find(
                    (file) => file.type === "pdf"
                );
                setSessionId(folder.sessionId); // Set the session ID for the folder
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

    function onDocumentLoadSuccess({
        numPages: loadedPages,
    }: {
        numPages: number;
    }) {
        setNumPages(loadedPages);
    }

    const startRecording = (pageNumber: number) => {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];
                setCurrentRecordingPage(pageNumber); // Set the current recording page

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: "audio/mp3",
                    });
                    const audioURL = URL.createObjectURL(audioBlob);
                    setRecordings((prevRecordings) => ({
                        ...prevRecordings,
                        [pageNumber]: audioURL,
                    }));
                    setCurrentRecordingPage(null); // Clear current recording page after stop

                    // Convert audioBlob to File and send it to the transcribe API
                    const audioFile = new File([audioBlob], "audio.mp3", {
                        type: "audio/mp3",
                    });
                    await transcribeAudio(audioFile, pageNumber);
                };

                mediaRecorder.start();
                setIsRecording(true);
            })
            .catch((error) =>
                console.error("Error accessing microphone:", error)
            );
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (audioFile: File, pageNumber: number) => {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("documentId", sessionId as string);
        formData.append("pageNumber", pageNumber.toString());

        try {
            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to transcribe audio: ${await response.text()}`
                );
            }

            const { transcription } = await response.json();
            setTranscriptions((prevTranscriptions) => ({
                ...prevTranscriptions,
                [pageNumber]: transcription,
            }));
        } catch (error) {
            console.error("Error transcribing audio:", error);
        }
    };

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
                    className="border p-0 mx-auto"
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
                                                width={500}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                className="mx-auto w-1/3"
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-center w-1/3">
                                            <div className="flex flex-col items-center">
                                                {isRecording &&
                                                currentRecordingPage ===
                                                    index + 1 ? (
                                                    <button
                                                        onClick={stopRecording}
                                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Stop Recording
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            startRecording(
                                                                index + 1
                                                            )
                                                        }
                                                        className="bg-blue-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Start Recording
                                                    </button>
                                                )}
                                                {recordings[index + 1] && (
                                                    <audio
                                                        controls
                                                        src={
                                                            recordings[
                                                                index + 1
                                                            ]
                                                        }
                                                        className="mt-2"
                                                    />
                                                )}
                                                {transcriptions[index + 1] && (
                                                    <textarea
                                                        className="mt-2 border rounded p-2 w-3/4 mx-auto text-center" // Center the textarea
                                                        rows={3}
                                                        readOnly
                                                        value={
                                                            transcriptions[
                                                                index + 1
                                                            ]
                                                        }
                                                        placeholder="Transcription will appear here"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 text-center w-1/3">
                                            Generating Notes...
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
