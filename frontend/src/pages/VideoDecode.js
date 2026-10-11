import { useState, useRef, useEffect } from "react";
import { decodeVideo } from "../api/videoApi";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./VideoDecode.css";

const MAX_VIDEO_MB = 100;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function VideoDecode({ setPage }) {
  const [video, setVideo] = useState(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [sizeError, setSizeError] = useState("");
  const processingTimer = useRef(null);
  const abortController = useRef(null);

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
      const remaining = 99 - p;
      p += remaining * 0.1;
      setProgress(Math.round(p));
    }, 300);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_BYTES) {
      setSizeError(`File too large! Max allowed is ${MAX_VIDEO_MB} MB. Selected: ${formatSize(f.size)}`);
      setVideo(null);
      e.target.value = "";
      return;
    }
    setSizeError("");
    setVideo(f);
  };

  const handleDecode = async () => {
    if (!video) {
      alert("Select encoded video");
      return;
    }

    if (abortController.current) abortController.current.abort();
    if (processingTimer.current) clearInterval(processingTimer.current);

    abortController.current = new AbortController();

    setProgress(0);
    setStatus("uploading");
    setMessage("");

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

      const res = await decodeVideo(
        video,
        onUploadProgress,
        abortController.current.signal
      );

      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(100);
      setStatus("complete");
      setMessage(res.secret_message || res.error);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(0);
      setStatus("error");
      alert("Video decode failed. Check if this is a HideIT-X file.");
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
          <h1 className="page-title">Video Reveal</h1>
          <p className="page-subtitle">Extract hidden messages from video files with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Encoded Video (MP4)</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="video/mp4"
              className="file-input"
              onChange={handleFileChange}
            />
            <span className="file-placeholder">
              {video
                ? `📎 ${video.name}  (${formatSize(video.size)})`
                : "Click to select Encoded MP4..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_VIDEO_MB} MB · MP4 only</span>
          {sizeError && <span className="file-size-error">{sizeError}</span>}
        </div>

        {status && status !== "" && (
          <ProgressBar
            progress={progress}
            fileName={video ? video.name : ""}
            status={status}
          />
        )}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleDecode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Decoding..." : <>Reveal Message <FaArrowRight /></>}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setPage("dashboard")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {message && (
          <div className="secret-message-box">
            <h3>Secret Message:</h3>
            <p>{message}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default VideoDecode;
