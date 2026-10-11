import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

// ================= IMAGE ENCODE =================
export const encodeImage = async (image, text, onUploadProgress, signal) => {
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("text", text);

    const response = await axios.post(
      `${API_URL}/image/encode`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // 🔥 IMPORTANT: receive real image
        onUploadProgress,
        signal, // ✅ Pass abort signal
      }
    );

    return response.data; // Blob (encoded image)

  } catch (error) {
    console.error("Encode API error:", error);
    throw error;
  }
};

// ================= IMAGE DECODE =================
export const decodeImage = async (image, onUploadProgress, signal) => {
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("image", image);

    const response = await axios.post(
      `${API_URL}/image/decode`,
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
    // { secret_message: "your hidden text" }

  } catch (error) {
    console.error("Decode API error:", error);
    throw error;
  }
};
