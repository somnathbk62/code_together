import React, { useState } from "react";
import axios from "axios";
import "./FileUpload.css"; // Ensure this CSS file exists for styling

const FileUpload = ({ roomId }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // ✅ Status Message
  const [isUploading, setIsUploading] = useState(false); // ✅ Upload State

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(`📂 Selected: ${selectedFile.name}`); // ✅ Show File Name
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("❌ No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);

    try {
      setIsUploading(true);
      setUploadStatus("⏳ Uploading..."); // ✅ Show Uploading State

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/upload`, // ✅ Uses Backend URL
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        setUploadStatus("✅ Upload Successful!"); // ✅ Success Message
      } else {
        setUploadStatus("❌ Upload Failed!");
      }
    } catch (error) {
      setUploadStatus("❌ Upload Failed! Try again.");
    } finally {
      setIsUploading(false);
      setFile(null); // ✅ Reset File Input
    }
  };

  return (
    <div className="file-upload-container">
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}{" "}
      {/* ✅ Show Upload Status */}
    </div>
  );
};

export default FileUpload;
