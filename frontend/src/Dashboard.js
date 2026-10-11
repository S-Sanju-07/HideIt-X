import { useState, useEffect } from "react";
import "./Dashboard.css";
import {
  FaImage,
  FaMusic,
  FaVideo,
  FaFileAlt,
  FaLock,
  FaUnlock,
  FaSignOutAlt,
  FaShieldAlt,
  FaEnvelope,
  FaThLarge,
  FaUserCircle,
  FaBell,
  FaSearch,
  FaSyncAlt,
  FaPlusCircle,
  FaStar,
  FaSun,
  FaMoon
} from "react-icons/fa";

import ImageEncode from "./pages/ImageEncode";
import ImageDecode from "./pages/ImageDecode";
import AudioEncode from "./pages/AudioEncode";
import AudioDecode from "./pages/AudioDecode";
import VideoEncode from "./pages/VideoEncode";
import VideoDecode from "./pages/VideoDecode";
import TextFileEncode from "./pages/TextFileEncode";
import TextFileDecode from "./pages/TextFileDecode";
import SendMail from "./pages/SendMail";

function Dashboard({ setPage }) {
  const [activeTab, setActiveTabState] = useState(
    () => sessionStorage.getItem("activeTab") || "overview"
  );

  // Wrapper that also persists the tab to sessionStorage
  const setActiveTab = (tab) => {
    sessionStorage.setItem("activeTab", tab);
    setActiveTabState(tab);
  };
  const userEmail = localStorage.getItem("userEmail") || "user@gmail.com";
  const userInitial = userEmail.charAt(0).toUpperCase();

  const [stats, setStats] = useState({ image: 0, audio: 0, video: 0, text: 0, mail: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/dashboard/stats", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
            setStats(data);
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchStats();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.setItem("page", "home");
    sessionStorage.removeItem("activeTab"); // clear saved tab on logout
    setPage("home");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: <FaThLarge /> },
    { id: "image", label: "Image Steganography", icon: <FaImage /> },
    { id: "audio", label: "Audio Steganography", icon: <FaMusic /> },
    { id: "video", label: "Video Steganography", icon: <FaVideo /> },
    { id: "text", label: "Text Steganography", icon: <FaFileAlt /> },
    { id: "mail", label: "Secure Mail", icon: <FaEnvelope /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="tab-content animate-slide-up">
            {/* Hero Overview Card */}
            <div className="overview-hero-card">
              <div className="hero-card-left">
                <h1>Dashboard Overview</h1>
                <p>Real-time security and steganography analytics</p>
              </div>
              <button className="btn-refresh-circle" onClick={handleRefresh} disabled={isRefreshing}>
                <FaSyncAlt className={isRefreshing ? "spin-animation" : ""} /> Refresh
              </button>
            </div>

            {/* Five Stat Cards */}
            <div className="stats-row">
              <div className="mini-stat-card">
                <div className="stat-icon-square img-icon">
                  <FaImage />
                </div>
                <div className="stat-content">
                  <span className="stat-name">IMAGE STEGANOGRAPHY</span>
                  <div className="stat-split">
                    <div className="split-item">
                      <span className="split-label">ENCODE</span>
                      <span className="split-value">{stats.image_encode || 0}</span>
                    </div>
                    <div className="split-item">
                      <span className="split-label">DECODE</span>
                      <span className="split-value">{stats.image_decode || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mini-stat-card">
                <div className="stat-icon-square aud-icon">
                  <FaMusic />
                </div>
                <div className="stat-content">
                  <span className="stat-name">AUDIO STEGANOGRAPHY</span>
                  <div className="stat-split">
                    <div className="split-item">
                      <span className="split-label">ENCODE</span>
                      <span className="split-value">{stats.audio_encode || 0}</span>
                    </div>
                    <div className="split-item">
                      <span className="split-label">DECODE</span>
                      <span className="split-value">{stats.audio_decode || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mini-stat-card active-card">
                <div className="stat-icon-square vid-icon">
                  <FaVideo />
                </div>
                <div className="stat-content">
                  <span className="stat-name">VIDEO STEGANOGRAPHY</span>
                  <div className="stat-split">
                    <div className="split-item">
                      <span className="split-label">ENCODE</span>
                      <span className="split-value">{stats.video_encode || 0}</span>
                    </div>
                    <div className="split-item">
                      <span className="split-label">DECODE</span>
                      <span className="split-value">{stats.video_decode || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="active-border"></div>
              </div>
              <div className="mini-stat-card">
                <div className="stat-icon-square" style={{ background: 'rgba(255, 165, 0, 0.1)', color: 'orange' }}>
                  <FaFileAlt />
                </div>
                <div className="stat-content">
                  <span className="stat-name">TEXT STEGANOGRAPHY</span>
                  <div className="stat-split">
                    <div className="split-item">
                      <span className="split-label">ENCODE</span>
                      <span className="split-value">{stats.text_encode || 0}</span>
                    </div>
                    <div className="split-item">
                      <span className="split-label">DECODE</span>
                      <span className="split-value">{stats.text_decode || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mini-stat-card">
                <div className="stat-icon-square msg-icon">
                  <FaEnvelope />
                </div>
                <div className="stat-content">
                  <span className="stat-name">SECURE MAIL COMMUNICATION</span>
                  <div className="stat-split">
                    <div className="split-item">
                      <span className="split-label">MAIL SENT</span>
                      <span className="split-value">{stats.mail || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "image":
        return renderServiceView("Image Steganography", "Conceal messages within image pixels with zero visual loss.", "image", "image-encode", "image-decode");
      case "audio":
        return renderServiceView("Audio Steganography", "Hide data within audio frequencies and waveforms.", "audio", "audio-encode", "audio-decode");
      case "video":
        return renderServiceView("Video Steganography", "Embed encrypted packages into multi-frame video sequences.", "video", "video-encode", "video-decode");
      case "text":
        return renderServiceView("Text Steganography", "Disguise sensitive information inside plain text or documents.", "text", "text-file-encode", "text-file-decode");
      case "mail":
        return (
          <div className="tab-content animate-slide-up center-flex">
            <div className="feature-hero-card mail-gradient">
              <div className="status-badge">
                <FaShieldAlt /> PROTECTED RELAY
              </div>
              <div className="feature-icon-box">
                <FaEnvelope />
              </div>
              <h2>Secure Gmail Delivery</h2>
              <p>Directly send your encoded files through our secure relay system with end-to-end encryption.</p>
              <button className="premium-btn" onClick={() => setActiveTab("send-mail")}>
                Get Started <FaPlusCircle />
              </button>
            </div>
          </div>
        );
      case "send-mail":
        return <SendMail setPage={(p) => {
          if (p === 'dashboard') setActiveTab("mail");
          else setPage(p);
        }} />;
      case "image-encode":
        return <ImageEncode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("image");
          else setPage(p);
        }} />;
      case "image-decode":
        return <ImageDecode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("image");
          else setPage(p);
        }} />;
      case "audio-encode":
        return <AudioEncode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("audio");
          else setPage(p);
        }} />;
      case "audio-decode":
        return <AudioDecode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("audio");
          else setPage(p);
        }} />;
      case "video-encode":
        return <VideoEncode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("video");
          else setPage(p);
        }} />;
      case "video-decode":
        return <VideoDecode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("video");
          else setPage(p);
        }} />;
      case "text-file-encode":
        return <TextFileEncode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("text");
          else setPage(p);
        }} />;
      case "text-file-decode":
        return <TextFileDecode setPage={(p) => {
          if (p === 'dashboard') setActiveTab("text");
          else setPage(p);
        }} />;
      default:
        return null;
    }
  };

  const renderServiceView = (title, desc, type, encodePage, decodePage) => {
    const icons = {
      image: <FaImage />,
      audio: <FaMusic />,
      video: <FaVideo />,
      text: <FaFileAlt />,
    };

    return (
      <div className="tab-content animate-slide-up center-flex">
        <div className={`feature-hero-card ${type}-card`}>
          <div className="status-badge">
            <FaShieldAlt /> ENCRYPTION ACTIVE
          </div>
          <div className="feature-icon-box">
            {icons[type]}
          </div>
          <div className="feature-text-content">
            <h2>{title}</h2>
            <p>{desc}</p>
          </div>
          <div className="feature-button-row">
            <button className="action-btn encode" onClick={() => setActiveTab(encodePage)}>
              <FaLock /> Encode Data
            </button>
            <button className="action-btn decode" onClick={() => setActiveTab(decodePage)}>
              <FaUnlock /> Decode Data
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`dashboard-root ${theme}-theme`}>
      {/* Side Navigation */}
      <aside className="side-nav">
        <div className="brand-section">
          <div className="brand-logo">
            <FaShieldAlt />
          </div>
          <span className="brand-text">HideIT-X</span>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-link-content">
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-text">{item.label}</span>
              </div>
              {activeTab === item.id && <div className="active-pill" />}
            </button>
          ))}
        </nav>

        <div className="side-nav-footer">
          <button className="btn-logout-premium" onClick={logout}>
            <FaSignOutAlt className="logout-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* Top Header */}
        <header className="main-header">
          <div className="header-left">
            <h2 className="header-title">Welcome to HideIT-X</h2>
          </div>

          <div className="header-right">
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            <div className="user-profile-widget">
              <div className="profile-details">
                <span className="user-name">{userEmail}</span>
                <span className="user-status">Online</span>
              </div>
              <div className="avatar-circle">
                <span>{userInitial}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="dashboard-content-area">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
