import cv2
import os
import subprocess
import numpy as np

def encode_video(video_path, secret_text, output_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Cannot open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Use lossy MJPG in intermediate is risky for LSB
    # But sticking to user's flow
    temp_avi = output_path.replace(".mp4", "_temp.avi")
    # Use HFYU (HuffYUV) for lossless intermediate storage
    fourcc = cv2.VideoWriter_fourcc(*"HFYU")
    out = cv2.VideoWriter(temp_avi, fourcc, fps, (width, height))
    
    # Prepare binary message
    message = secret_text.encode("utf-8")
    length_bin = format(len(message), "032b")
    
    # Vectorized bit extraction:
    msg_bytes = np.frombuffer(message, dtype=np.uint8)
    msg_bits = np.unpackbits(msg_bytes)
    
    # Prefix length bits
    len_bits = np.array([int(b) for b in length_bin], dtype=np.uint8)
    
    all_bits = np.concatenate((len_bits, msg_bits))
    total_bits = len(all_bits)
    
    bits_written = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if bits_written < total_bits:
            flat = frame.reshape(-1)
            available = len(flat)
            needed = total_bits - bits_written
            to_write = min(available, needed)
            
            chunk = all_bits[bits_written : bits_written + to_write]
            target_pixels = flat[:to_write]
            target_pixels &= 254
            target_pixels |= chunk
            
            flat[:to_write] = target_pixels
            frame = flat.reshape(height, width, 3)
            bits_written += to_write
            
        out.write(frame)
        
    cap.release()
    out.release()

    # ---------- CONVERT AVI → MP4 USING FFMPEG LOSSLESS ----------
    # We use libx264rgb with -crf 0 to ensure it is TRULY lossless and 
    # stays in RGB colorspace (avoiding YUV conversion which ruins LSBs).
    cmd = [
        "ffmpeg", "-y",
        "-i", temp_avi,
        "-vcodec", "libx264rgb",
        "-crf", "0",
        "-preset", "ultrafast",
        output_path
    ]
    
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(temp_avi):
        os.remove(temp_avi)

def encode_video_eof(input_path, secret_text, output_path):
    with open(input_path, 'rb') as f:
        data = f.read()
    
    # We use a START and END delimiter to reliably extract it from the EOF
    full_secret = "###START###" + secret_text + "###END###"
    msg_bytes = full_secret.encode('utf-8')
    
    with open(output_path, 'wb') as f:
        f.write(data)
        f.write(msg_bytes)
