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
    Chip,
} from "@nextui-org/react";
import Link from "next/link";

// Define the type for each session
type Session = {
    id: number;
    name: string;
    date: string;
    status: string;
};

// Define the columns with correct types
const columns: { key: keyof Session | "actions"; label: string }[] = [
    { key: "name", label: "Session Name" },
    { key: "date", label: "Date Created" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
];

const Home: NextPage = () => {
    const [sessionName, setSessionName] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]); // Use Session[] type

    const handleCreateSession = () => {
        if (sessionName) {
            const newSession: Session = {
                id: sessions.length + 1,
                name: sessionName,
                date: new Date().toLocaleDateString(),
                status: "active", // Default status
            };
            setSessions([...sessions, newSession]);
            setSessionName("");
        }
    };

    return (
        <div className="container mx-auto p-4">
            {/* Session Creation Card */}
            <Card className="mb-6 shadow-md">
                <CardBody className="flex flex-col md:flex-row gap-4 items-center">
                    <Input
                        fullWidth
                        label="Session Name"
                        placeholder="Enter session name"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                    />
                    <Button onPress={handleCreateSession} color="primary">
                        Create Session
                    </Button>
                </CardBody>
            </Card>

            {/* Sessions Table */}
            <Table aria-label="Sessions table with dynamic content">
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn key={column.key}>
                            {column.label}
                        </TableColumn>
                    ))}
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell>{session.name}</TableCell>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color={
                                        session.status === "active"
                                            ? "success"
                                            : session.status === "paused"
                                            ? "danger"
                                            : "warning"
                                    }
                                >
                                    <span className="capitalize text-xs">
                                        {session.status}
                                    </span>
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    onPress={() =>
                                        console.log("View", session.id)
                                    }
                                >
                                    <Link
                                        href={`/sessions/${session.id}`}
                                        passHref
                                    >
                                        View
                                    </Link>
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
