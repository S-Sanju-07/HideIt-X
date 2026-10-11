import { useState, useRef, useEffect } from "react";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./TextFileDecode.css";

const MAX_TEXT_MB = 5;
const MAX_TEXT_BYTES = MAX_TEXT_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function TextFileDecode({ setPage }) {
  const [file, setFile] = useState(null);
  const [decodedMessage, setDecodedMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [sizeError, setSizeError] = useState("");
  const processingTimer = useRef(null);
  const xhrRef = useRef(null);

  useEffect(() => {
    return () => {
      if (processingTimer.current) clearInterval(processingTimer.current);
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, []);

  const startProcessingSimulation = () => {
    setStatus("processing");
    let p = 60;
    processingTimer.current = setInterval(() => {
      const remaining = 99 - p;
      p += remaining * 0.08;
      setProgress(Math.round(p));
    }, 300);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_TEXT_BYTES) {
      setSizeError(`File too large! Max allowed is ${MAX_TEXT_MB} MB. Selected: ${formatSize(f.size)}`);
      setFile(null);
      e.target.value = "";
      return;
    }
    setSizeError("");
    setFile(f);
  };

  const handleDecode = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again");
      setPage("login");
      return;
    }

    if (!file) {
      alert("Please select a text file");
      return;
    }

    if (processingTimer.current) clearInterval(processingTimer.current);
    setProgress(0);
    setStatus("uploading");
    setDecodedMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("POST", "http://127.0.0.1:5000/text-file/decode");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        // Default responseType is text, which is fine for JSON

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 60);
            setProgress(pct);
          }
        };

        xhr.upload.onload = () => {
          startProcessingSimulation();
        };

        xhr.onload = () => {
          clearInterval(processingTimer.current);
          processingTimer.current = null;
          xhrRef.current = null;

          if (xhr.status === 401) {
            reject({ status: 401 });
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            reject({ status: xhr.status, error: xhr.statusText });
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Network error"));
        };

        xhr.send(formData);
      });

      setProgress(100);
      setStatus("complete");
      setDecodedMessage(result.secret_message); // Backend returns { secret_message: ... }

    } catch (error) {
      clearInterval(processingTimer.current);
      processingTimer.current = null;

      if (error.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.setItem("page", "login");
        setPage("login");
        return;
      }

      setProgress(0);
      setStatus("error");
      console.error(error);
      alert("Decode failed");
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <button className="back-arrow-btn" onClick={() => setPage("dashboard")}>
          <FaArrowLeft />
        </button>

        <div className="status-badge">
          <FaShieldAlt /> DECRYPTION CORE
        </div>

        <div className="page-header">
          <h1 className="page-title">Text Reveal</h1>
          <p className="page-subtitle">Extract hidden secrets from text files with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Encoded Text File (.txt)</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".txt"
              className="file-input"
              onChange={handleFileChange}
            />
            <span className="file-placeholder">
              {file
                ? `📎 ${file.name}  (${formatSize(file.size)})`
                : "Click to select Encoded .txt..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_TEXT_MB} MB · .TXT only</span>
          {sizeError && <span className="file-size-error">{sizeError}</span>}
        </div>

        {status && status !== "" && (
          <ProgressBar
            progress={progress}
            fileName={file ? file.name : ""}
            status={status}
          />
        )}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleDecode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Decoding..." : <>Reveal Secret <FaArrowRight /></>}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setPage("dashboard")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {decodedMessage && (
          <div className="secret-message-box">
            <h3>Secret Message:</h3>
            <p>{decodedMessage}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default TextFileDecode;
