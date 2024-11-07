"use client";
import React from "react";
import dynamic from "next/dynamic";
import { TableWrapper } from "../table/table";
import { CardBalance1 } from "./card-balance1";
import { CardBalance2 } from "./card-balance2";
import { CardBalance3 } from "./card-balance3";
import { CardAgents } from "./card-agents";
import { CardTransactions } from "./card-transactions";
import { Link } from "@nextui-org/react";
import NextLink from "next/link";

const Chart = dynamic(
    () => import("../charts/steam").then((mod) => mod.Steam),
    {
        ssr: false,
    }
);

export const Content = () => (
    <div className="h-full lg:px-6">
        {/* File Upload Section */}
        <div className="flex flex-col justify-center w-full py-5 px-4 lg:px-0 max-w-[90rem] mx-auto gap-3">
            <h3 className="text-xl font-semibold text-center">
                Upload Class Notes or Lesson Plan
            </h3>
            <p className="text-center text-gray-600">
                Please upload PDF or Word documents only. The uploaded file will
                be available for students in the session.
            </p>
            <div className="flex flex-col items-center mt-4 gap-3">
                <input
                    type="file"
                    accept=".pdf, .doc, .docx"
                    className="border border-gray-300 p-2 rounded-md cursor-pointer"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        // handle file upload logic here
                        console.log("Selected file:", file);
                    }}
                />
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    onClick={() => {
                        // add functionality here
                        console.log("Submit button clicked");
                    }}
                >
                    Submit
                </button>
            </div>
        </div>

        {/* Students Section */}
        <div className="flex flex-col justify-center w-full py-5 px-4 lg:px-0 max-w-[90rem] mx-auto gap-3">
            <div className="flex flex-wrap justify-between">
                <h3 className="text-center text-xl font-semibold">
                    Active Students in Session
                </h3>
                <Link
                    href="/accounts"
                    as={NextLink}
                    color="primary"
                    className="cursor-pointer"
                >
                    View All
                </Link>
            </div>
            <TableWrapper />
        </div>
    </div>
);
