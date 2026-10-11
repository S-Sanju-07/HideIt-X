import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import "./SendMail.css";

const MAX_ATTACH_MB = 25;
const MAX_ATTACH_BYTES = MAX_ATTACH_MB * 1024 * 1024;
const API = "http://localhost:5000";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function SendMail({ setPage }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sizeError, setSizeError] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const xhrRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_ATTACH_BYTES) {
      setSizeError(`Attachment too large! Max allowed is ${MAX_ATTACH_MB} MB. Selected: ${formatSize(f.size)}`);
      setFile(null);
      e.target.value = "";
      return;
    }
    setSizeError("");
    setFile(f);
  };

  const handleSend = () => {
    if (!to || !subject || !body || !file) {
      setMessage("Please fill all details and select a file.");
      setStatus("error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Session expired. Please login again.");
      setStatus("error");
      return;
    }

    // Abort any in-flight request
    if (xhrRef.current) xhrRef.current.abort();

    setIsSending(true);
    setUploadProgress(0);
    setMessage("");
    setStatus(null);
    setTimeLeft(120);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const formData = new FormData();
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("body", body);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // ── Upload progress ──────────────────────────────────────────────────────
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(pct);
      }
    };

    // ── Response received ────────────────────────────────────────────────────
    xhr.onload = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      xhrRef.current = null;
      setIsSending(false);
      setUploadProgress(0);

      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setMessage(data.message || "Mail sent successfully!");
          setStatus("success");
          // Clear form on success
          setTo("");
          setSubject("");
          setBody("");
          setFile(null);
        } else {
          setMessage(data.error || data.message || "Mail sending failed.");
          setStatus("error");
        }
      } catch {
        setMessage(xhr.status >= 200 && xhr.status < 300
          ? "Mail queued successfully!"
          : "Unexpected server response.");
        setStatus(xhr.status >= 200 && xhr.status < 300 ? "success" : "error");
      }
    };

    // ── Network error ────────────────────────────────────────────────────────
    xhr.onerror = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      xhrRef.current = null;
      setIsSending(false);
      setUploadProgress(0);
      setMessage("Network error — unable to reach the server. Is Flask running?");
      setStatus("error");
    };

    // ── Timeout (120 s — generous safety net) ────────────────────────────────
    xhr.ontimeout = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      xhrRef.current = null;
      setIsSending(false);
      setUploadProgress(0);
      setMessage("Connection timed out. Please check your network and try again.");
      setStatus("error");
    };

    xhr.timeout = 120000; // 120 seconds timer

    xhr.open("POST", `${API}/mail/send`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <button className="back-arrow-btn" onClick={() => setPage("dashboard")}>
          <FaArrowLeft />
        </button>

        <div className="status-badge">
          <FaShieldAlt /> SECURE TRANSFER
        </div>

        <div className="page-header">
          <h1 className="page-title">Secure Mail</h1>
          <p className="page-subtitle">Deliver your encrypted assets safely with HideIT-X.</p>
        </div>

        <div className="mail-form">
          {/* Recipient */}
          <div className="input-group">
            <label className="input-label">Recipient Address</label>
            <input
              type="email"
              className="text-input"
              placeholder="e.g. contact@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Subject */}
          <div className="input-group">
            <label className="input-label">Security Subject</label>
            <input
              type="text"
              className="text-input"
              placeholder="Encrypted data transfer..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div className="input-group">
            <label className="input-label">Secure Message Body</label>
            <textarea
              className="text-area"
              placeholder="Write your secure message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Attachment */}
          <div className="input-group">
            <label className="input-label">Encrypted Attachment</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                className="file-input"
                onChange={handleFileChange}
                disabled={isSending}
              />
              <span className="file-placeholder">
                {file
                  ? `📎 ${file.name}  (${formatSize(file.size)})`
                  : "Click to select secure file..."}
              </span>
            </div>
            <span className="file-size-hint">Max attachment size: {MAX_ATTACH_MB} MB</span>
            {sizeError && <span className="file-size-error">{sizeError}</span>}
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <><span className="sending-dot"></span> Sending...</>
              ) : (
                <>Commence Transmission <FaArrowRight /></>
              )}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setPage("dashboard")}
              disabled={isSending}
            >
              <FaArrowLeft /> Back
            </button>
          </div>

          {/* Upload progress — only shown while uploading */}
          {isSending && (
            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-stats">
                <span className="progress-label">
                  {uploadProgress < 100
                    ? `Uploading... ${uploadProgress}%`
                    : "Transmitting securely..."}
                </span>
                <span className="progress-percent">
                  {uploadProgress < 100 ? `${uploadProgress}%` : `${timeLeft}s`}
                </span>
              </div>
              {uploadProgress === 100 && (
                <div className="countdown-info" style={{ marginTop: '8px', fontSize: '13px', color: '#8892b0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Waiting for server response...</span>
                  <span>Timeout in {timeLeft}s</span>
                </div>
              )}
            </div>
          )}

          {/* Result message */}
          {message && (
            <div className={`status-message status-${status}`}>
              <span className="status-icon">
                {status === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </span>
              <div>
                <strong>{status === "success" ? "Transmission Successful" : "Transmission Failed"}</strong>
                <p>{message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendMail;
