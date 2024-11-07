"use client";
import React, { useState, useEffect } from "react";

<<<<<<< HEAD
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
=======
export const Content = () => {
  type ChatMessage = {
    sender: string;
    message: string;
  };
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };
  
  const handleSubmit = async () => {
    if (!question) return;

    setLoading(true);

    // Add user's question to the chat history
    setChatHistory((prev) => [...prev, { sender: "user", message: question }]);

    try {
      const payload = {
        content: question,
        askedBy: "student123", // Replace with dynamic user ID if available
        type: "text",
      };

      const response = await fetch(
        "https://bc-3415-project2.vercel.app/api/sessions/HxHLPMlzfeGtLzjFVX9r/questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch response from the API");
      }

      const data = await response.json();
      const botMessage = data.answer || "No response from server";

      // Update chat history with bot response
      setChatHistory((prev) => [...prev, { sender: "bot", message: botMessage }]);
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => [...prev, { sender: "bot", message: "Error processing request." }]);
    }

    setLoading(false);
    setQuestion("");
    setUploadedFile(null);
  };

  return (
    <div className="h-full lg:px-6 flex flex-col items-center gap-6">
      {/* Main Chat Box Container */}
      <div className="w-full max-w-2xl p-5 border rounded-lg shadow-md flex flex-col gap-4 bg-gray-50">
        <h1 style={{color:'black'}}>Chat History</h1>
        {/* Chat History Display */}
        <div className="overflow-y-auto max-h-[300px] flex flex-col gap-4" style={{minHeight:'10rem', border:'1px grey solid', borderRadius:'0.5rem'}}>
          {chatHistory.map((entry, index) => (
            <div
              key={index}
              className={`p-3 rounded-md ${
                entry.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-900"
              }`}
            >
              <strong>{entry.sender === "user" ? "You" : "AI"}:</strong> {entry.message}
            </div>
          ))}
          {loading && <p className="text-gray-500">Generating response...</p>}
        </div>
  
        {/* Divider */}
        <hr className="my-4" />
  
        {/* Question and File Upload Section */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Question Input */}
          <div className="flex-1">
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md h-12 bg-white text-black"
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
  
          {/* File Upload Input */}
          <div className="flex-1">
            <input
              type="file"
              accept=".pdf, image/*"
              className="w-full p-2 border border-gray-300 rounded-md h-12 cursor-pointer text-black"
              onChange={handleFileUpload}
            />
          </div>
        </div>
  
        {/* Submit Button */}
        <div className="flex justify-end mt-4">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
  
};
>>>>>>> 3bffdc3bcd6a33ea16e22ca008a71afe97a35e5c
