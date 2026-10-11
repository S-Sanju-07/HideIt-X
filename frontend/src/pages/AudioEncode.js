import { useState, useRef, useEffect } from "react";
import { encodeAudio } from "../api/audioApi";
import ProgressBar from "../components/ProgressBar";
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import "./AudioEncode.css";

const MAX_AUDIO_MB = 50;
const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const AudioEncode = ({ setPage }) => {
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
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
    if (f.size > MAX_AUDIO_BYTES) {
      setSizeError(`File too large! Max allowed is ${MAX_AUDIO_MB} MB. Selected: ${formatSize(f.size)}`);
      setAudio(null);
      e.target.value = "";
      return;
    }
    setSizeError("");
    setAudio(f);
  };

  const handleEncode = async () => {
    if (!audio || !text) {
      alert("Please select MP3 and enter text");
      return;
    }

    if (abortController.current) abortController.current.abort();
    if (processingTimer.current) clearInterval(processingTimer.current);

    abortController.current = new AbortController();

    setProgress(0);
    setStatus("uploading");
    setDownloadUrl(null);

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

      const data = await encodeAudio(
        audio,
        text,
        onUploadProgress,
        abortController.current.signal
      );

      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(100);
      setStatus("complete");

      const url = window.URL.createObjectURL(
        new Blob([data], { type: "audio/wav" })
      );
      setDownloadUrl(url);

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      clearInterval(processingTimer.current);
      processingTimer.current = null;
      abortController.current = null;
      setProgress(0);
      setStatus("error");
      console.error(err);
      alert("Audio encode failed");
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
          <h1 className="page-title">Audio Hide</h1>
          <p className="page-subtitle">Embed secret messages into audio files invisibly with HideIT-X.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Cover Audio (MP3)</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".mp3"
              className="file-input"
              onChange={handleFileChange}
            />
            <span className="file-placeholder">
              {audio
                ? `📎 ${audio.name}  (${formatSize(audio.size)})`
                : "Click to select MP3 file..."}
            </span>
          </div>
          <span className="file-size-hint">Max file size: {MAX_AUDIO_MB} MB · MP3 only</span>
          {sizeError && <span className="file-size-error">{sizeError}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Secret Message</label>
          <textarea
            className="text-area"
            placeholder="Enter secret message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {status && status !== "" && (
          <ProgressBar
            progress={progress}
            fileName={audio ? audio.name : ""}
            status={status}
          />
        )}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleEncode}
            disabled={status === "uploading" || status === "processing"}
          >
            {status === "uploading" || status === "processing" ? "Encoding..." : <>Encode Audio <FaArrowRight /></>}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setPage("dashboard")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {downloadUrl && (
          <div className="result-area audio-result">
            <div className="audio-preview-card">
              <span className="preview-label">SECURE PREVIEW:</span>
              <audio controls src={downloadUrl}></audio>
            </div>
            <a
              href={downloadUrl}
              download="encoded_audio.wav"
              className="download-btn"
            >
              Download Encoded WAV <FaArrowRight />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioEncode;
