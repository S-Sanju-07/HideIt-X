import wave
import numpy as np

# Delimiter to signal end of message
DELIMITER = "###END###"

def encode_audio(wav_path, secret_text, output_path):
    with wave.open(wav_path, 'rb') as audio:
        params = audio.getparams()
        # Read all frames at once (audio files fit in RAM usually, 5 mins FLAC = 100MB)
        # If massive (>1GB), chunking needed, but unlikely for stego use case here.
        frames = audio.readframes(audio.getnframes())

    # Create mutable copy
    audio_data = np.frombuffer(frames, dtype=np.int16).copy()
    
    full_secret = secret_text + DELIMITER
    
    # 1. Encode text to bytes (UTF-8 handles all chars)
    msg_bytes_obj = full_secret.encode('utf-8')
    required_bits = len(msg_bytes_obj) * 8
    
    max_bits = len(audio_data)

    if required_bits > max_bits:
        raise Exception(f"Message too large. Need {required_bits} bits, have {max_bits}.")

    # 2. Convert to numpy byte array
    msg_bytes = np.frombuffer(msg_bytes_obj, dtype=np.uint8)
    
    # 3. Unpack bits (big endian) - [128, 64, 32...]
    msg_bits = np.unpackbits(msg_bytes)
    
    # 4. Vectorized LSB replacement
    bit_count = len(msg_bits)
    
    target_samples = audio_data[:bit_count]
    
    # Clear LSBs
    target_samples &= ~1
    
    # Set LSBs
    target_samples |= msg_bits.astype(np.int16)
    
    audio_data[:bit_count] = target_samples

    with wave.open(output_path, 'wb') as encoded:
        encoded.setparams(params)
        encoded.writeframes(audio_data.tobytes())

def encode_audio_eof(input_path, secret_text, output_path):
    with open(input_path, 'rb') as f:
        data = f.read()
    
    full_secret = "###START###" + secret_text + DELIMITER
    msg_bytes = full_secret.encode('utf-8')
    
    with open(output_path, 'wb') as f:
        f.write(data)
        f.write(msg_bytes)
