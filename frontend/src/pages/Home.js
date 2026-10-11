import React from "react";
import {
    FaArrowRight,
    FaSignInAlt,
    FaUserPlus,
    FaShieldAlt,
    FaEye,
    FaUsers,
    FaStar,
    FaLightbulb,
    FaCommentDots,
    FaLock,
    FaImage,
    FaMusic,
    FaVideo,
    FaFileAlt
} from "react-icons/fa";
import "./Home.css";

const Home = ({ setPage }) => {
    return (
        <div className="home-container">

            {/* ================= NAVBAR + HERO ================= */}
            <div className="hero-wrapper">
                <nav className="home-nav">
                    <div className="home-logo-container">
                        <FaShieldAlt style={{ color: "white", fontSize: "1.5rem" }} />
                        <span className="logo-text">HIDEIT X</span>
                    </div>

                    <div className="nav-links-center">
                        <a href="#about" className="nav-link">About</a>
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#how-it-works" className="nav-link">How it Works</a>
                    </div>

                    <div className="nav-buttons-right">
                        <button className="login-btn" onClick={() => setPage("login")}>
                            <FaSignInAlt style={{ marginRight: "5px" }} />
                            Login
                        </button>
                        <br />
                        
                        <button className="signup-btn" onClick={() => setPage("register")}>
                            <FaUserPlus style={{ marginRight: "5px" }} />
                            Sign Up
                        </button>
                    </div>
                </nav>

                <header className="hero-content">
                    <span className="welcome-badge">
                        Advanced Multimedia Security Platform
                    </span>

                    <h1>
                        HideIT X - A Web Platform Integrating Multimedia
                        Steganography with Secure Communication Protocol
                    </h1>

                    <p>
                        HideIT X enables secure hiding and extraction of confidential
                        information inside multimedia files such as images, audio,
                        video, and text using advanced steganography techniques
                        combined with secure authentication protocols.
                    </p>

                    <div style={{ marginTop: "20px" }}>
                        <button
                            className="explore-btn"
                            onClick={() => setPage("login")}
                        >
                            Get Started <FaArrowRight style={{ marginLeft: "6px" }} />
                        </button>
                    </div>
                </header>

                {/* <div className="wave-divider">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path
                            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,
              168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83
              c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8
              C59.71,118.43,147.3,126,221.33,113.36
              274.72,104.21,305.4,82.1,321.39,56.44Z"
                            className="shape-fill"
                        ></path>
                    </svg>
                </div> */}
            </div>

            {/* ================= ABOUT SECTION ================= */}
            <section id="about" className="about-section">
                <div className="section-header">
                    <h2>About HideIT X</h2>
                    <div className="header-underline"></div>
                </div>

                <div className="about-grid">
                    <div className="about-text">
                        <h3>Securing Digital Communication Through Steganography</h3>

                        <p>
                            HideIT X is a modern web-based application developed to
                            integrate multimedia steganography with secure communication
                            protocols. It ensures that confidential data can be embedded
                            within digital files without affecting their visual or audio
                            quality.
                        </p>

                        <p>
                            The system uses authentication mechanisms such as JWT-based
                            security and encrypted communication to prevent unauthorized
                            access.
                        </p>

                        <p>
                            Our platform supports multiple file formats and ensures high
                            confidentiality, integrity, and reliability in digital
                            communication.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES SECTION ================= */}
            <section id="features" className="features-container">
                <div className="section-header">
                    <h2>Features</h2>
                    <div className="header-underline"></div>
                </div>
                <div className="features-grid">

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaImage /></div>
                        <h4>Image Steganography</h4>
                        <p>Hide secret data inside images using secure encoding algorithms.</p>
                    </div>

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaMusic /></div>
                        <h4>Audio Steganography</h4>
                        <p>Embed confidential messages inside audio files without distortion.</p>
                    </div>

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaVideo /></div>
                        <h4>Video Steganography</h4>
                        <p>Securely conceal sensitive data within video frames.</p>
                    </div>

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaFileAlt /></div>
                        <h4>Text Steganography</h4>
                        <p>Hide information within structured text documents securely.</p>
                    </div>

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaLock /></div>
                        <h4>Secure Protocol Integration</h4>
                        <p>JWT authentication and encrypted communication ensure maximum protection.</p>
                    </div>

                    <div className="vision-card">
                        <div className="icon-wrapper"><FaLightbulb /></div>
                        <h4>Advanced Algorithms</h4>
                        <p>Optimized encoding techniques for high capacity and security.</p>
                    </div>

                </div>
            </section>

            {/* ================= HOW IT WORKS ================= */}
            <section id="how-it-works" className="steps-section">
                <div className="section-header">
                    <h2>How It Works?</h2>
                    <div className="header-underline"></div>
                </div>

                <div className="steps-grid">
                    <div className="step-item"><span className="step-number">1</span><span className="step-text">Create Account</span></div>
                    <div className="step-item"><span className="step-number">2</span><span className="step-text">Select Media Type</span></div>
                    <div className="step-item"><span className="step-number">3</span><span className="step-text">Upload File</span></div>
                    <div className="step-item"><span className="step-number">4</span><span className="step-text">Encode / Decode</span></div>
                    <div className="step-item"><span className="step-number">5</span><span className="step-text">Secure Communication</span></div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="home-footer">
                © 2026 HideIT X | A Web Platform Integrating Multimedia Steganography
                with Secure Communication Protocol | Developed by Sanju S & Pranaav K K
            </footer>

        </div>
    );
};

export default Home;
