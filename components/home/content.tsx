"use client";
import React, { useState, useEffect } from "react";

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
    if (!question && !uploadedFile) return;

    setLoading(true);

    if (question) {
      setChatHistory((prev) => [...prev, { sender: "user", message: question }]);
    } else if (uploadedFile) {
      setChatHistory((prev) => [...prev, { sender: "user", message: "Uploaded file" }]);
    }

    try {
      let imageContent = "";

      if (uploadedFile) {
        imageContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result); // Only resolve if result is a string
            } else {
              reject(new Error("File content is not a string"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(uploadedFile); // Reads image file as Data URL
        });
      }
  
      // Prepare the payload, including question and image content if available
      const payload = {
        file: uploadedFile,
        content: ``,
        askedBy: "student123", // Replace with dynamic user ID if available
        type: "image",
        prompt: `I am a student asking questions wanting to learn. Do not give me the answer immediately but guide me in the correct direction. ${question || ""}\n\nImage Content:\n${imageContent || ""}`,
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
    <div style={{ height: '100%', paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop:'3rem' }}>
      <h1 style={{fontFamily:"Sans-Serif", fontWeight:'800', fontSize:'30px'}}>Student's Helper Page</h1>
      
      {/* Main Chat Box Container */}
      <div style={{ width: '100%', maxWidth: '42rem', padding: '1.25rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ color: 'white', fontFamily:"Sans-Serif", fontWeight:'800', fontSize:'22px' }}>Chat History</h1>
        
        {/* Chat History Display */}
        <div style={{ overflowY: 'auto', maxHeight: '18.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '10rem', border: '0.3px solid grey', borderRadius: '0.5rem', backgroundColor:'#27272A', padding:'1rem 0 1rem 0' }}>
        {chatHistory.map((entry, index) => (
            <div
              key={index}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: entry.sender === "user" ? '#bfdbfe' : '#e5e7eb',
                color: entry.sender === "user" ? '#1e3a8a' : '#374151',
                width: 'auto',
                alignSelf: entry.sender === "user" ? 'flex-end' : 'flex-start', // Align user to right, AI to left
                textAlign: entry.sender === "user" ? 'right' : 'left', // Text alignment
                marginLeft: entry.sender === "user" ? '0rem' : '1rem', // Padding from left for AI
                marginRight: entry.sender === "user" ? '1rem' : '0rem', // Padding from right for user
              }}
            >
              <strong>{entry.sender === "user" ? "You" : "Professor Gu"}:</strong> {entry.message}
            </div>
          ))}
          {loading && <p style={{ color: 'white' }}>Generating response...</p>}
        </div>

        {/* Divider */}
        <hr style={{ margin: '1rem 0' }} />

        {/* Question and File Upload Section */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexDirection: 'row' }}>
            <div style={{ flex: '1' }}>
              <textarea
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  height: '3rem',
                  backgroundColor: '#27272A',
                  color: 'white'
                }}
                placeholder="Ask me anything!!"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

          {/* File Upload Input */}
          <div style={{ flex: '1' }}>
            <input
              type="file"
              accept="image/*"
              style={{
                marginTop:'-0.4rem',
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                height: '3rem',
                cursor: 'pointer',
                color: 'white',
                backgroundColor:'#27272A'
              }}
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
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
