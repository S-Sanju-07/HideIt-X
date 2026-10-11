import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const encodeVideo = async (video, text, onUploadProgress, signal) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("video", video);
  formData.append("text", text);

  const response = await axios.post(
    `${API_URL}/video/encode`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob", // important for download
      onUploadProgress,
      signal, // ✅ Pass abort signal
    }
  );

  return response.data;
};

export const decodeVideo = async (video, onUploadProgress, signal) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("video", video);

  const response = await axios.post(
    `${API_URL}/video/decode`,
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
