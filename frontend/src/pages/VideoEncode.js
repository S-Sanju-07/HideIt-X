import { useState, useRef, useEffect } from "react";
import { encodeVideo } from "../api/videoApi";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./VideoEncode.css";

const MAX_VIDEO_MB = 100;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function VideoEncode({ setPage }) {
  const [video, setVideo] = useState(null);
  const [text, setText] = useState("");
  const [encodedBlob, setEncodedBlob] = useState(null);
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

  const handleEncode = async () => {
    if (!video || !text) {
      alert("Select video and enter text");
      return;
    }

    if (abortController.current) abortController.current.abort();
    if (processingTimer.current) clearInterval(processingTimer.current);

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

      const res = await encodeVideo(
        video,
        text,
        onUploadProgress,
        abortController.current.signal
      );

      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(100);
      setStatus("complete");
      setEncodedBlob(res);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(0);
      setStatus("error");
      alert("Video encoding failed");
    }
  };

  const downloadVideo = () => {
    const url = window.URL.createObjectURL(encodedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encoded_video.mp4";
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
          <h1 className="page-title">Video Hide</h1>
          <p className="page-subtitle">Securely hide text within MP4 videos with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Cover Video (MP4)</label>
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
                : "Click to select MP4 video..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_VIDEO_MB} MB · MP4 only</span>
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
            fileName={video ? video.name : ""}
            status={status}
          />
        )}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleEncode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Encoding..." : <>Encode Video <FaArrowRight /></>}
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
            <button onClick={downloadVideo} className="download-btn">
              Download Encoded Video <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoEncode;
