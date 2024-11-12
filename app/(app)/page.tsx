"use client";
import type { NextPage } from "next";
import React, { useState, useEffect } from "react";
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
import Link from "next/link";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

// Define the type for each folder and file
type Folder = {
  id: string;
  name: string;
  date: string;
  sessionId: string;
  files: { name: string; type: string; url: string }[];
};

// Define the columns with correct types
const columns: { key: keyof Folder | "actions"; label: string }[] = [
  { key: "name", label: "Folder Name" },
  { key: "date", label: "Date Created" },
  { key: "sessionId", label: "Session ID" }, // Display session ID
  { key: "actions", label: "Actions" },
];

const Home: NextPage = () => {
  const [folders, setFolders] = useState<Folder[]>([]);

  // Fetch folders from Firestore on component mount
  useEffect(() => {
    const fetchFolders = async () => {
      const folderCollection = collection(db, "folders");
      const folderSnapshot = await getDocs(folderCollection);
      const folderList: Folder[] = folderSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Folder[];

      // Sort folders by extracting the numeric part from the name (e.g., "Week1" -> 1)
      folderList.sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ""), 10); // Extract number from name
        const numB = parseInt(b.name.replace(/\D/g, ""), 10); // Extract number from name
        return numA - numB; // Sort in ascending order
      });

      setFolders(folderList);
    };

    fetchFolders();
  }, []);

  const handleZipUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploadZip", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Upload successful:", result);
        setFolders((prevFolders) => [...prevFolders, ...result.folders]);

        // For each file in the response, upload to the documents collection
        for (const folder of result.folders) {
          for (const file of folder.files) {
            const documentData = new FormData();
            console.log(file);
            documentData.append("file", String(file.url)); // Attach file content
            documentData.append("name", file.name);
            documentData.append("type", file.type);
            documentData.append("sessionId", folder.sessionId);
            documentData.append("uploadedBy", "professor123"); // Replace with actual logged-in user

            await fetch("/api/documents", {
              method: "POST",
              body: documentData,
            });
          }
        }
      } else {
        console.error("Upload failed:", result.error);
      }
    } catch (error) {
      console.error("Error uploading ZIP file:", error);
    }
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
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {folders.map((folder) => (
            <TableRow key={folder.id}>
              <TableCell>{folder.name}</TableCell>
              <TableCell>{folder.date}</TableCell>
              <TableCell>{folder.sessionId}</TableCell>
              <TableCell>
                <Link href={`/folders/${folder.id}`} passHref>
                  <Button size="sm">View</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Home;
