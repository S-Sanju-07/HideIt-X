import cv2
import numpy as np

def decode_video(video_path):
    # First check for EOF injection
    with open(video_path, 'rb') as f:
        data = f.read()
        
    start_delimiter_bytes = b"###START###"
    delimiter_bytes = b"###END###"
    
    start_idx = data.rfind(start_delimiter_bytes)
    end_idx = data.rfind(delimiter_bytes)
    
    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        secret_bytes = data[start_idx + len(start_delimiter_bytes):end_idx]
        try:
            return secret_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return secret_bytes.decode('latin1')

    # If not EOF injection, try LSB extraction
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return ""

    # Message state
    bytes_accumulated = bytearray()
    message_length = None
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # 1. Flatten frame (H*W*3)
        flat = frame.reshape(-1)
        
        # 2. Extract LSBs (vectorized)
        lsbs = flat & 1
        
        # 3. Pack bits (8 -> 1 byte)
        # We need multiple of 8 to pack cleanly
        remainder = len(lsbs) % 8
        if remainder:
            lsbs = lsbs[:-remainder]
            
        # Pack bits (high-bit first? wait, check encoder logic)
        # Encoder used standard int write?
        # Actually my encoder used np.unpackbits which is big-endian (high bit first).
        # Standard LSB stego usually builds byte bit-by-bit from stream order.
        # If I used np.packbits, it packs 8 bits [b0, b1... b7] into byte.
        # b0 becomes MSB (128).
        # My encoder wrote: msg_bits = np.unpackbits(msg_bytes) -> [b0, b1...] (big endian)
        # So b0 of message byte -> index 0 of bit array -> index 0 of frame pixel -> LSB.
        # Decoder reads index 0 of frame pixel -> LSB -> index 0 of bit array.
        # So packbits MUST match unpackbits order (big).
        # Yes, bitorder='big' is default.
        
        frame_bytes = np.packbits(lsbs)
        
        # Append to buffer
        bytes_accumulated.extend(frame_bytes)
        
        # Only process if we have enough data for header (4 bytes)
        if message_length is None:
            if len(bytes_accumulated) >= 4:
                # Extract length from first 4 bytes
                # But wait, original code read 32 bits as string '0010...' then int(bits, 2).
                # int('0010...', 2) interprets '0' as MSB.
                # My packbits interprets index 0 as MSB.
                # So byte 0 is MSB of length integers?
                # Original encode: format(len, '032b') -> '0000...101'
                # So string index 0 is MSB.
                # My unpack logic preserves this.
                
                # We need to construct 32-bit int from 4 bytes (Big Endian)
                header = bytes_accumulated[:4]
                # struct.unpack('>I') would work
                message_length = int.from_bytes(header, byteorder='big')
                
                # Remove header from accumulated data (conceptually)
                # But careful about slicing bytearray repeatedly (slow copy).
                # Be better: keep header in array, just offset data reads.
                
                # Sanity check
                if message_length <= 0 or message_length > 10000000: # 10MB limit
                     cap.release()
                     return ""
        
        # Check if we have enough data (Length + 4 header bytes)
        if message_length is not None:
             total_needed = 4 + message_length
             if len(bytes_accumulated) >= total_needed:
                 # Success!
                 payload = bytes_accumulated[4 : total_needed]
                 cap.release()
                 try:
                     return payload.decode('utf-8')
                 except:
                     try:
                         return payload.decode('latin1')
                     except:
                         return ""

    cap.release()
    return ""
