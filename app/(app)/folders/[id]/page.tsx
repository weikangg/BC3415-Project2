"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { CircularProgress } from "@nextui-org/progress";
// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type DocumentFile = {
    name: string;
    type: string;
    url: string;
};

type Folder = {
    id: string;
    name: string;
    date: string;
    files: DocumentFile[];
    sessionId: string;
};

const FolderDetail = () => {
    const params = useParams();
    const id = params.id;
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [folder, setFolder] = useState<Folder | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);
    const [recordings, setRecordings] = useState<{ [key: number]: string }>({});
    const [transcriptions, setTranscriptions] = useState<{
        [key: number]: string;
    }>({});
    const [summaries, setSummaries] = useState<{ [key: number]: string }>({});
    const [textLayers, setTextLayers] = useState<{ [key: number]: string }>({});
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [currentRecordingPage, setCurrentRecordingPage] = useState<
        number | null
    >(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    const generateQRCode = async () => {
        try {
            console.log(id);
            const response = await fetch(`/api/sessions/${id}/qrcode`);
            // const response = await fetch(`/api/sessions/HxHLPMlzfeGtLzjFVX9r/qrcode`);
            // const response = await fetch(`/api/sessions/1HtIY4Mln3ZY2DRju3m2/qrcode`);
            const data = await response.json();
            setQrCodeUrl(data.qrCodeDataUrl);
        } catch (error) {
            console.error("Error fetching QR code:", error);
        }
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState("");
    const handleInsightGeneration = async () => {
        // Set loading state to true
        setLoading(true);
        setError(null);

        try {
            // Make a GET request to the insights endpoint
            const response = await fetch(
                `/api/sessions/HxHLPMlzfeGtLzjFVX9r/insights`,
                {
                    method: "GET",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to generate insights");
            }

            // Parse the response JSON
            const data = await response.json();

            // Update the insights state with the generated insights
            setInsights(data.insights);
        } catch (error) {
            console.error("Error generating insights:", error);
            // setError("There was an error generating insights. Please try again.");
        } finally {
            // Set loading state to false
            setLoading(false);
        }
    };

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
                setSessionId(folder.sessionId);
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
                setCurrentRecordingPage(pageNumber);

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
                    setCurrentRecordingPage(null);

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

            if (textLayers[pageNumber]) {
                await sendSummaryRequest(
                    textLayers[pageNumber],
                    transcription,
                    pageNumber
                );
            }
        } catch (error) {
            console.error("Error transcribing audio:", error);
        }
    };

    const sendSummaryRequest = async (
        content: string,
        transcription: string,
        pageNumber: number
    ) => {
        try {
            const response = await fetch("/api/summary", {
                method: "POST",
                body: JSON.stringify({
                    documentId: sessionId,
                    pageNumber,
                    content,
                    transcription,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to generate summary: ${await response.text()}`
                );
            }

            const { summary } = await response.json();
            console.log("Summary:", summary);
            setSummaries((prevSummaries) => ({
                ...prevSummaries,
                [pageNumber]: summary,
            }));
        } catch (error) {
            console.error("Error generating summary:", error);
        }
    };

    if (!folder) return <p>Loading...</p>;

    return (
        <div className="container mx-auto p-4">
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    alignSelf: "center",
                    gap: "1rem",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "42rem",
                        padding: "1.25rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        backgroundColor: "#1f2937",
                    }}
                >
                    <h1
                        style={{
                            color: "white",
                            fontFamily: "Sans-Serif",
                            fontWeight: "800",
                            fontSize: "22px",
                        }}
                    >
                        Session QR Code Generator
                    </h1>
                    <h2
                        style={{
                            color: "white",
                            fontFamily: "Sans-Serif",
                            fontWeight: "400",
                            fontSize: "15px",
                            textAlign: "center",
                        }}
                    >
                        Generate a QR code to share this session with
                        participants
                    </h2>

                    <button
                        onClick={generateQRCode}
                        style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            padding: "0.5rem 1.5rem",
                            borderRadius: "0.5rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background-color 0.2s",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: "600",
                        }}
                        disabled={loading}
                    >
                        {loading ? "Generating..." : "Create Session QR (SQR)"}
                    </button>

                    {qrCodeUrl && (
                        <div style={{ textAlign: "center", marginTop: "1rem" }}>
                            <h3
                                style={{
                                    color: "white",
                                    fontFamily: "Sans-Serif",
                                    fontWeight: "600",
                                    fontSize: "18px",
                                }}
                            >
                                Session QR Code
                            </h3>
                            <img
                                src={qrCodeUrl}
                                alt="Session QR Code"
                                style={{
                                    border: "2px solid #d1d5db",
                                    borderRadius: "0.5rem",
                                    marginTop: "1rem",
                                    padding: "0.5rem",
                                    backgroundColor: "white",
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Insight Generation */}

                <div
                    style={{
                        width: "100%",
                        maxWidth: "42rem",
                        padding: "1.25rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        backgroundColor: "#1f2937",
                        height: "28rem",
                    }}
                >
                    <h1
                        style={{
                            color: "white",
                            fontFamily: "Sans-Serif",
                            fontWeight: "800",
                            fontSize: "22px",
                        }}
                    >
                        Insight Generation
                    </h1>
                    <h1
                        style={{
                            color: "white",
                            fontFamily: "Sans-Serif",
                            fontWeight: "400",
                            fontSize: "15px",
                        }}
                    >
                        Get some insight into what students are asking
                    </h1>

                    {/* Chat History Display */}
                    <div
                        style={{
                            overflowY: "auto",
                            maxHeight: "18.75rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            minHeight: "10rem",
                            border: "0.3px solid grey",
                            borderRadius: "0.5rem",
                            backgroundColor: "#27272A",
                            padding: "1rem 1rem 1rem 1rem",
                        }}
                    >
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        {insights && (
                            <div
                                style={{
                                    color: "white",
                                    marginTop: "1rem",
                                    lineHeight: "1.6",
                                }}
                            >
                                {/* Split insights by numbers followed by periods to identify list items */}
                                {insights.split(/\d+\.\s/).map(
                                    (paragraph, index) =>
                                        paragraph && ( // Ensure we don't render empty paragraphs
                                            <p
                                                key={index}
                                                style={{
                                                    marginBottom: "1rem",
                                                    textIndent: "1rem",
                                                }}
                                            >
                                                {index + 1}. {paragraph.trim()}
                                            </p>
                                        )
                                )}
                            </div>
                        )}
                        {loading && (
                            <p style={{ color: "white" }}>
                                Generating response...
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "1rem",
                        }}
                    >
                        <button
                            style={{
                                backgroundColor: "#3b82f6",
                                color: "white",
                                padding: "0.5rem 1.5rem",
                                borderRadius: "0.5rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onClick={handleInsightGeneration}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate Insights"}
                        </button>
                    </div>
                </div>
            </div>

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
                                                renderTextLayer={true}
                                                className="mx-auto w-1/3"
                                                onGetTextSuccess={(
                                                    textContent
                                                ) => {
                                                    const text =
                                                        textContent.items
                                                            .map((item) => {
                                                                if (
                                                                    "str" in
                                                                    item
                                                                ) {
                                                                    return item.str;
                                                                }
                                                                return "";
                                                            })
                                                            .join(" ");

                                                    setTextLayers(
                                                        (prevTextLayers) => ({
                                                            ...prevTextLayers,
                                                            [index + 1]: text,
                                                        })
                                                    );
                                                }}
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-center w-1/3 border">
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
                                                        className="mt-2 border rounded p-2 w-3/4 mx-auto text-center"
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
                                            {recordings[index + 1]
                                                ? summaries[index + 1] || (
                                                      <div className="flex justify-center items-center h-full">
                                                          <CircularProgress aria-label="Loading..." />
                                                      </div>
                                                  )
                                                : "Please record an audio"}
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
