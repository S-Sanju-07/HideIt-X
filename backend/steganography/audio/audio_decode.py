import wave
import numpy as np

DELIMITER = "###END###"

def decode_audio(wav_path):
    try:
        # First check for EOF injection
        with open(wav_path, 'rb') as f:
            data = f.read()
            
        start_delimiter_bytes = b"###START###"
        delimiter_bytes = DELIMITER.encode('utf-8')
        
        start_idx = data.rfind(start_delimiter_bytes)
        end_idx = data.rfind(delimiter_bytes)
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            secret_bytes = data[start_idx + len(start_delimiter_bytes):end_idx]
            try:
                return secret_bytes.decode('utf-8')
            except UnicodeDecodeError:
                return secret_bytes.decode('latin1')
                
        # If not EOF injection, try LSB extraction (only if it's a valid WAV file)
        try:
            with wave.open(wav_path, 'rb') as audio:
                n_frames = audio.getnframes()
                frames = audio.readframes(n_frames)
        except wave.Error:
            # Not a valid wave file and no EOF injection found
            return ""

        # 1. Fast load into numpy
        audio_data = np.frombuffer(frames, dtype=np.int16)
        
        # 2. Vectorized LSB extraction (O(N) in C, very fast)
        lsbs = audio_data & 1
        
        # 3. Pack bits into bytes (8 bits -> 1 byte)
        # We need to ensure we have a multiple of 8 to pack cleanly
        # If not, truncate the end (it's just silence/noise)
        remainder = len(lsbs) % 8
        if remainder:
            lsbs = lsbs[:-remainder]
            
        # Reshape to (N/8, 8) and pack bits
        # np.packbits packs high-bit first by default, but stego usually does stream order
        # We need to be careful with bit order. 
        # Usually: bit 0, bit 1, bit 2... -> byte
        # np.packbits with axis=1 packs rows.
        
        bytes_data = np.packbits(lsbs.reshape(-1, 8), axis=1, bitorder='big')
        
        # 4. Convert to string to find delimiter
        # flatten is needed if reshape was used
        raw_bytes = bytes_data.flatten().tobytes()
        
        # Try decoding as latin1 first to avoid utf-8 errors on random noise
        # But our delimiter is ASCII, so search in bytes is safer
        
        delimiter_bytes = DELIMITER.encode('utf-8')
        end_index = raw_bytes.find(delimiter_bytes)
        
        if end_index != -1:
            # Found it! Extract message up to delimiter
            secret_bytes = raw_bytes[:end_index]
            try:
                return secret_bytes.decode('utf-8')
            except UnicodeDecodeError:
                # Fallback or partial
                return secret_bytes.decode('latin1')
        
        return ""
        
    except Exception as e:
        print(f"Error decoding audio: {e}")
        return ""
