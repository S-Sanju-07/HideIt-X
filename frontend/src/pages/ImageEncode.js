import { useState, useRef, useEffect } from "react";
import { encodeImage } from "../services/imageService";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./ImageEncode.css"; // ✅ Import the new CSS

const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImageEncode({ setPage }) {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [encodedBlob, setEncodedBlob] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [sizeError, setSizeError] = useState("");
  const processingTimer = useRef(null);
  const abortController = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimer.current) clearInterval(processingTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  const startProcessingSimulation = () => {
    setStatus("processing");
    let p = 60;
    processingTimer.current = setInterval(() => {
      // Approach 99% faster initially
      const remaining = 99 - p;
      p += remaining * 0.1; // Increased speed slightly
      setProgress(Math.round(p));
    }, 300);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      setSizeError(`File too large! Max allowed is ${MAX_IMAGE_MB} MB. Selected: ${formatSize(f.size)}`);
      setImage(null);
      e.target.value = "";
      return;
    }
    setSizeError("");
    setImage(f);
  };

  const handleEncode = async () => {
    if (!image || !text) {
      alert("Select image and enter secret text");
      return;
    }

    // Cancel previous request if active
    if (abortController.current) abortController.current.abort();
    if (processingTimer.current) clearInterval(processingTimer.current);

    // Create new abort controller
    abortController.current = new AbortController();

    setProgress(0);
    setStatus("uploading");
    setEncodedBlob(null);

    try {
      const onUploadProgress = (e) => {
        if (e.total) {
          const pct = Math.round((e.loaded / e.total) * 60);
          setProgress(pct);
          if (e.loaded === e.total) {
            startProcessingSimulation();
          }
        }
      };

      const blob = await encodeImage(
        image,
        text,
        onUploadProgress,
        abortController.current.signal
      );

      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(100);
      setStatus("complete");
      setEncodedBlob(blob);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }
      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(0);
      setStatus("error");
      alert("Encoding failed");
      console.error(err);
    }
  };

  const handleDownload = () => {
    const url = window.URL.createObjectURL(encodedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encoded.png";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <button className="back-arrow-btn" onClick={() => setPage("dashboard")}>
          <FaArrowLeft />
        </button>

        <div className="status-badge">
          <FaShieldAlt /> ENCRYPTION CORE
        </div>

        <div className="page-header">
          <h1 className="page-title">Image Hide</h1>
          <p className="page-subtitle">Encrypt text into images invisibly with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Cover Image</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={handleFileChange}
            />
            <span className="file-placeholder">
              {image
                ? `📎 ${image.name}  (${formatSize(image.size)})`
                : "Click to select PNG/JPG..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_IMAGE_MB} MB · PNG / JPG</span>
          {sizeError && <span className="file-size-error">{sizeError}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Secret Message</label>
          <textarea
            className="text-area"
            placeholder="Enter the secret text to hide..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {status && status !== "" && (
          <ProgressBar
            progress={progress}
            fileName={image ? image.name : ""}
            status={status}
          />
        )}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleEncode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Encoding..." : <>Encode Image <FaArrowRight /></>}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setPage("dashboard")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {encodedBlob && (
          <div className="result-area">
            <button onClick={handleDownload} className="download-btn">
              Download Encoded Image <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageEncode;
