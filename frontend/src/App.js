import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Home from "./pages/Home";

import ImageEncode from "./pages/ImageEncode";
import ImageDecode from "./pages/ImageDecode";
import TextFileEncode from "./pages/TextFileEncode";
import TextFileDecode from "./pages/TextFileDecode";

// AUDIO
import AudioEncode from "./pages/AudioEncode";
import AudioDecode from "./pages/AudioDecode";

import VideoEncode from "./pages/VideoEncode";
import VideoDecode from "./pages/VideoDecode";

// ✅ NEW
import SendMail from "./pages/SendMail";

function App() {
  const [page, setPage] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Default to home if not logged in
      return "home";
    }
    return "dashboard";
  });

  useEffect(() => {
    localStorage.setItem("page", page);
  }, [page]);

  return (
    <div>
      {page === "home" && <Home setPage={setPage} />}
      {page === "login" && <Login setPage={setPage} />}
      {page === "register" && <Register setPage={setPage} />}
      {page === "dashboard" && <Dashboard setPage={setPage} />}

      {/* IMAGE */}
      {page === "image-encode" && <ImageEncode setPage={setPage} />}
      {page === "image-decode" && <ImageDecode setPage={setPage} />}

      {/* TEXT FILE */}
      {page === "text-file-encode" && <TextFileEncode setPage={setPage} />}
      {page === "text-file-decode" && <TextFileDecode setPage={setPage} />}

      {/* AUDIO */}
      {page === "audio-encode" && <AudioEncode setPage={setPage} />}
      {page === "audio-decode" && <AudioDecode setPage={setPage} />}

      {/* VIDEO */}
      {page === "video-encode" && <VideoEncode setPage={setPage} />}
      {page === "video-decode" && <VideoDecode setPage={setPage} />}

      {/* ✅ SEND MAIL */}
      {page === "send-mail" && <SendMail setPage={setPage} />}
    </div>
  );
}

export default App;

