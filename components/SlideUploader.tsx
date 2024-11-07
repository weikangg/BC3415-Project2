"use client";
import { useState } from "react";

export default function SlideUploader() {
    const [slides, setSlides] = useState([]);

    const handleFileChange = (event) => {
        const newFiles = Array.from(event.target.files);
        setSlides((prevSlides) => [...prevSlides, ...newFiles]);
    };

    const handleUpload = () => {
        if (slides.length === 0) {
            alert("Please upload at least one slide.");
            return;
        }
        // Implement upload logic here (e.g., send slides to the server or store them locally)
        alert("Slides uploaded successfully!");
    };

    return (
        <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Upload Slides</h2>

            <input
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.jpg,.png"
                onChange={handleFileChange}
                className="mb-4"
            />

            <div className="mb-4">
                <h3 className="font-semibold mb-2">Selected Slides:</h3>
                <ul className="list-disc ml-5">
                    {slides.map((slide, index) => (
                        <li key={index}>{slide.name}</li>
                    ))}
                </ul>
            </div>

            <button
                onClick={handleUpload}
                className="w-full py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
                Upload Slides
            </button>
        </div>
    );
}
