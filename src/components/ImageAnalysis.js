import React, { useState, useEffect } from "react";

const ImageAnalysis = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setAnalysis(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = () => {
            const base64Image = reader.result.split(",")[1];

            fetch("http://127.0.0.1:5000/api/analyze-medical-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64Image }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) throw new Error(data.error);
                    setAnalysis(data);
                })
                .catch((err) => {
                    if (err.message === "Upload a medical-related image.") {
                        setError("Please upload a medical-related image.");
                    } else {
                        setError("Analysis failed: " + err.message);
                    }
                    console.error("Analysis Error:", err);
                })
                .finally(() => setLoading(false));
        };
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {/* Centered Container */}
            <div className="shadow-lg rounded-lg p-6 max-w-3xl w-full bg-white flex flex-col items-center text-center">
                {/* Centered Heading */}
                <h1 className="text-3xl font-bold mb-6 text-blue-600">
                    <u>Medical Image Analysis</u>
                </h1>

                {/* Centered File Input */}
                <div className="mb-6">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="border-4 border-blue-600 font-bold px-3 py-2 rounded-lg cursor-pointer"
                    />
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className="mb-6 flex flex-col items-center">
                        <img src={imagePreview} alt="Preview" className="max-w-md border border-gray-300 rounded-lg mb-4" />
                        <button
                            onClick={analyzeImage}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded transition"
                        >
                            {loading ? "Analyzing..." : "Analyze Image"}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {/* Display Analysis Results */}
                {analysis && (
                    <div className="mt-6 p-6 rounded-lg shadow bg-gray-50 w-full">
                        <h2 className="text-xl font-bold text-gray-700"><u>Analysis Results</u>:</h2>

                        {/* Caption */}
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-600">⮞ Caption:</h3>
                            <p className="italic text-gray-700">{analysis.altText || "No caption available"}</p>
                        </div>

                        {/* Enhanced Context */}
                        {analysis.enhancedContext && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-gray-600">⮞ Enhanced Medical Context:</h3>
                                <p className="whitespace-pre-line text-gray-700">
                                    {(() => {
                                        const context = analysis.enhancedContext || "";
                                        const lastFullStop = context.lastIndexOf(".");
                                        return lastFullStop !== -1 ? context.substring(0, lastFullStop + 1) : context;
                                    })()}
                                </p>
                            </div>
                        )}

                        {/* Injury Severity Progress Bar */}
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-600">⮞ Injury Severity:</h3>
                            <div className="w-full rounded-full h-6 mt-2 bg-gray-200">
                                <div className="bg-red-500 h-6 rounded-full" style={{ width: `${analysis.severity}%` }}></div>
                            </div>
                            <p className="text-center font-semibold mt-2">{analysis.severity}% Serious</p>
                        </div>

                        {/* Precautions */}
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-600">⮞ Precautions:</h3>
                            <ul className="list-disc pl-5 text-gray-700">
                                {(() => {
                                    const precautions = analysis.precautions || "";
                                    const precautionPoints = precautions.split("\n").map(p => p.trim());
                                    const validPrecautions = precautionPoints.filter(p => p.endsWith("."));
                                    return validPrecautions.length > 0
                                        ? validPrecautions.map((point, index) => {
                                            const parts = point.split(":");
                                            const title = parts[0]?.trim();
                                            const description = parts.slice(1).join(":").trim();
                                            return (
                                                <li key={index}>
                                                    <strong>{title}:</strong> {description}
                                                </li>
                                            );
                                        })
                                        : <li>No precautions provided.</li>;
                                })()}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageAnalysis;
