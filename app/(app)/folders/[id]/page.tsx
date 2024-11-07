"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Define the type for each file
type File = {
    name: string;
    type: string;
    url: string; // Add URL for files to display or link to the file content
};

// Define the type for each folder
type Folder = {
    id: string;
    name: string;
    date: string;
    files: File[];
};

const FolderDetail = () => {
    const params = useParams();
    const id = params.id; // Access the folder ID from the route params
    const [folder, setFolder] = useState<Folder | null>(null);

    useEffect(() => {
        if (!id) return;

        // Function to fetch folder data by ID from Firestore
        const fetchFolderData = async () => {
            try {
                const folderRef = doc(db, "folders", id as string);
                const folderDoc = await getDoc(folderRef);

                if (folderDoc.exists()) {
                    const folderData = folderDoc.data() as Folder;
                    setFolder({
                        ...folderData,
                    });
                } else {
                    console.error("Folder not found");
                }
            } catch (error) {
                console.error("Error fetching folder data:", error);
            }
        };

        fetchFolderData();
    }, [id]);

    if (!folder) return <p>Loading...</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{folder.name}</h1>
            <p>Date Created: {folder.date}</p>

            <Table aria-label="Files table">
                <TableHeader>
                    <TableColumn>File Name</TableColumn>
                    <TableColumn>Type</TableColumn>
                    <TableColumn>Preview</TableColumn>
                </TableHeader>
                <TableBody>
                    {folder.files.map((file, index) => (
                        <TableRow key={index}>
                            <TableCell>{file.name}</TableCell>
                            <TableCell>{file.type}</TableCell>
                            <TableCell>
                                {file.type === "pdf" ? (
                                    <embed
                                        src={file.url}
                                        type="application/pdf"
                                        width="100"
                                        height="100"
                                    />
                                ) : (
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View File
                                    </a>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FolderDetail;
