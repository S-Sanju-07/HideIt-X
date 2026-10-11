import "./ProgressBar.css";

function ProgressBar({ progress = 0, fileName = "", status = "uploading" }) {
    const getStatusText = () => {
        switch (status) {
            case "uploading":
                return "Uploading file…";
            case "processing":
                return "Server is processing… this may take a moment";
            case "complete":
                return "Complete!";
            case "error":
                return "Failed";
            default:
                return "Working…";
        }
    };

    const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

    return (
        <div className={`progress-container ${status}`}>
            <div className="progress-info">
                <div className="progress-file-row">
                    <span className="progress-file-icon">📄</span>
                    <span className="progress-file-name" title={fileName}>
                        {fileName || "File"}
                    </span>
                </div>
                <span className="progress-percent">{clampedProgress}%</span>
            </div>

            <div className="progress-track">
                <div
                    className={`progress-fill progress-fill--${status}`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>

            <div className="progress-status-row">
                <span className="progress-status-text">{getStatusText()}</span>
                {status !== "complete" && status !== "error" && (
                    <span className="progress-spinner" />
                )}
            </div>
        </div>
    );
}

export default ProgressBar;
