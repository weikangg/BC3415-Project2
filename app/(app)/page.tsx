"use client";
import type { NextPage } from "next";
import React, { useState } from "react";
import {
    Card,
    CardBody,
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";
import JSZip from "jszip";

// Define the type for each folder and file
type Folder = {
    id: number;
    name: string;
    date: string;
    files: { name: string; type: string }[];
};

// Define the columns with correct types
const columns: { key: keyof Folder | "actions"; label: string }[] = [
    { key: "name", label: "Folder Name" },
    { key: "date", label: "Date Created" },
    { key: "actions", label: "Actions" },
];

const Home: NextPage = () => {
    const [folders, setFolders] = useState<Folder[]>([]);

    // Function to handle ZIP file upload
    const handleZipUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        const newFolders: Folder[] = [];
        let folderId = folders.length + 1;
        console.log("content: ", content);
        // Identify top-level folders (e.g., "Week1", "Week2", etc.)
        content.forEach((relativePath, zipEntry) => {
            const pathParts = relativePath.split("/");
            console.log("parthParts: ", pathParts);
            console.log("ZipEntry: ", zipEntry);
            // Check if it's a top-level folder
            if (zipEntry.dir && pathParts[1] != "") {
                const folderName = pathParts[1];
                const folder: Folder = {
                    id: folderId++,
                    name: folderName,
                    date: new Date().toLocaleDateString(),
                    files: [],
                };

                // Add files under this folder
                content.forEach((innerPath, innerZipEntry) => {
                    if (
                        innerPath.startsWith(folderName) &&
                        !innerZipEntry.dir
                    ) {
                        folder.files.push({
                            name: innerZipEntry.name,
                            type: innerZipEntry.name.endsWith(".pptx")
                                ? "pptx"
                                : "doc",
                        });
                    }
                });

                newFolders.push(folder);
            }
        });

        setFolders([...folders, ...newFolders]);
    };

    return (
        <div className="container mx-auto p-4">
            {/* ZIP File Upload Card */}
            <Card className="mb-6 shadow-md">
                <CardBody className="flex flex-col md:flex-row gap-4 items-center">
                    <Input
                        type="file"
                        onChange={handleZipUpload}
                        accept=".zip"
                        label="Upload ZIP File"
                    />
                </CardBody>
            </Card>

            {/* Folders Table */}
            <Table aria-label="Folders table with dynamic content">
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn key={column.key}>
                            {column.label}
                        </TableColumn>
                    ))}
                </TableHeader>
                <TableBody>
                    {folders.map((folder) => (
                        <TableRow key={folder.id}>
                            <TableCell>{folder.name}</TableCell>
                            <TableCell>{folder.date}</TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    onPress={() =>
                                        console.log("View", folder.id)
                                    }
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default Home;
