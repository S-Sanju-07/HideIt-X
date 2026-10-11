import { useState, useRef, useEffect } from "react";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./TextFileEncode.css";

const MAX_TEXT_MB = 5;
const MAX_TEXT_BYTES = MAX_TEXT_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function TextFileEncode({ setPage }) {
  const [file, setFile] = useState(null);
  const [secretText, setSecretText] = useState("");
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

  const handleEncode = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again");
      setPage("login");
      return;
    }

    if (!file || !secretText) {
      alert("Please select a text file and enter secret text");
      return;
    }

    if (processingTimer.current) clearInterval(processingTimer.current);
    setProgress(0);
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("secret_text", secretText);

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("POST", "http://127.0.0.1:5000/text-file/encode");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.responseType = "blob"; // Important for file download

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
            resolve({ ok: true, blob: xhr.response });
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

      // Auto-download
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "encoded_text.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

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
      alert("Encode failed");
    }
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
          <h1 className="page-title">Text Hide</h1>
          <p className="page-subtitle">Hide data inside text files effortlessly with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Base Text File (.txt)</label>
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
                : "Click to select .txt file..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_TEXT_MB} MB · .TXT only</span>
          {sizeError && <span className="file-size-error">{sizeError}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Secret Message</label>
          <textarea
            className="text-area"
            placeholder="Enter the secret message to embed..."
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
          />
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
            onClick={handleEncode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Encoding..." : <>Encode Text <FaArrowRight /></>}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setPage("dashboard")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

      </div>
    </div>
  );
}

export default TextFileEncode;
