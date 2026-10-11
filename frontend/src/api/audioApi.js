import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const encodeAudio = async (audioFile, text, onUploadProgress, signal) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("text", text);

  const response = await axios.post(
    `${API_URL}/audio/encode`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
      onUploadProgress,
      signal, // ✅ Pass abort signal
    }
  );

  return response.data;
};

export const decodeAudio = async (audioFile, onUploadProgress, signal) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("audio", audioFile);

  const response = await axios.post(
    `${API_URL}/audio/decode`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress,
      signal, // ✅ Pass abort signal
    }
  );

  return response.data;
};
