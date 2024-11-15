"use client";
import React, { useState } from "react";

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
  
    // Add user's question to the chat history
    if (question) {
      setChatHistory((prev) => [...prev, { sender: "user", message: question }]);
    } else if (uploadedFile) {
      setChatHistory((prev) => [...prev, { sender: "user", message: "Uploaded image" }]);
    }
  
    try {
      let response;
      
      if (uploadedFile) {
        // If there is an image file (with or without text), use FormData
        const formData = new FormData();
        formData.append("content", `I am a student asking questions wanting to learn. Do not give me the answer immediately but guide me in the correct direction. ${question || ""}`);
        formData.append("askedBy", "student123"); // Replace with dynamic user ID if available
        formData.append("type", "image");
        formData.append("file", uploadedFile); // Append the image file
  
        response = await fetch("/api/sessions/HxHLPMlzfeGtLzjFVX9r/questions", {
          method: "POST",
          body: formData,
        });
      } else {
        // If only text is present, use JSON payload
        const payload = {
          content: `I am a student asking questions wanting to learn. Do not give me the answer immediately but guide me in the correct direction. ${question}`,
          askedBy: "student123",
          type: "text",
        };
  
        response = await fetch("/api/sessions/HxHLPMlzfeGtLzjFVX9r/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
  
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

  // const QRCodeDisplay = ({ sessionId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const generateQRCode = async () => {
    try {
      // const response = await fetch(`/api/sessions/${sessionId}/qrcode`);
      const response = await fetch(`/api/sessions/HxHLPMlzfeGtLzjFVX9r/qrcode`);
      const data = await response.json();
      setQrCodeUrl(data.qrCodeDataUrl);
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };
  
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState("");
  const handleInsightGeneration = async () => {
    // Set loading state to true
    setLoading(true);
    setError(null);
  
    try {
      // Make a GET request to the insights endpoint
      const response = await fetch(`/api/sessions/HxHLPMlzfeGtLzjFVX9r/insights`, {
        method: "GET",
      });
  
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
  }


  

  return (
    <div style={{ height: '100%', paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop:'3rem' }}>
      <h1 style={{fontFamily:"Sans-Serif", fontWeight:'800', fontSize:'30px'}}>Student's Helper Page</h1>
      
      {/* Main Chat Box Container */}
      <div style={{ width: '100%', maxWidth: '42rem', padding: '1.25rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor:'#1f2937' }}>
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
                marginLeft: entry.sender === "user" ? '1rem' : '1rem', // Padding from left for AI
                marginRight: entry.sender === "user" ? '1rem' : '1rem', // Padding from right for user
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexDirection: 'column' }}>
            <div style={{  }}>
              <textarea
                style={{
                  width: '18rem',
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
          <div style={{  }}>
            <input
              type="file"
              accept="image/*"
              style={{
                marginTop:'-0.4rem',
                width: '18rem',
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


      {/* <div style={{ width: '100%', maxWidth: '42rem', padding: '1.25rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor:'#1f2937' }}>
        <h1 style={{ color: 'white', fontFamily:"Sans-Serif", fontWeight:'800', fontSize:'22px' }}>Insight Generation</h1>
        <h1 style={{ color: 'white', fontFamily:"Sans-Serif", fontWeight:'400', fontSize:'15px' }}>Get some insight into what students are asking</h1>
        
        <div style={{ overflowY: 'auto', maxHeight: '18.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '10rem', border: '0.3px solid grey', borderRadius: '0.5rem', backgroundColor:'#27272A', padding:'1rem 1rem 1rem 1rem' }}>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {insights && (
            <div style={{ color: 'white', marginTop: '1rem', lineHeight: '1.6' }}>
              {insights.split(/\d+\.\s/).map((paragraph, index) => (
                paragraph && ( // Ensure we don't render empty paragraphs
                  <p key={index} style={{ marginBottom: '1rem', textIndent: '1rem' }}>
                    {index + 1}. {paragraph.trim()}
                  </p>
                )
              ))}
            </div>
          )}
          {loading && <p style={{ color: 'white' }}>Generating response...</p>}
        </div>

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
            onClick={handleInsightGeneration}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Insights"}
          </button>
        </div>
      </div> */}


      {/* <div
      style={{
        width: '100%',
        maxWidth: '42rem',
        padding: '1.25rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: '#1f2937',
      }}
    >
      <h1 style={{ color: 'white', fontFamily: 'Sans-Serif', fontWeight: '800', fontSize: '22px' }}>
        Session QR Code Generator
      </h1>
      <h2 style={{ color: 'white', fontFamily: 'Sans-Serif', fontWeight: '400', fontSize: '15px', textAlign: 'center' }}>
        Generate a QR code to share this session with participants
      </h2>

      <button
        onClick={generateQRCode}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.5rem 1.5rem',
          borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          border: 'none',
          fontSize: '16px',
          fontWeight: '600',
        }}
        disabled={loading}
      >
        {loading ? "Generating..." : "Create Session QR (SQR)"}
      </button>

      {qrCodeUrl && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <h3 style={{ color: 'white', fontFamily: 'Sans-Serif', fontWeight: '600', fontSize: '18px' }}>
            Session QR Code
          </h3>
          <img
            src={qrCodeUrl}
            alt="Session QR Code"
            style={{
              border: '2px solid #d1d5db',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: 'white',
            }}
          />
        </div>
      )}
    </div> */}

    </div>

  );
  
};
