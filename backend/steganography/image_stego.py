from PIL import Image

DELIMITER = "#####"

def encode_image(input_path, secret_text, output_path):
    image = Image.open(input_path)
    image = image.convert("RGB")
    
    # 1. Prepare secret binary string
    binary_secret = ''.join(format(ord(c), '08b') for c in (secret_text + DELIMITER))
    secret_len = len(binary_secret)
    
    pixels = list(image.getdata())
    
    if secret_len > len(pixels) * 3:
        raise ValueError("Image not large enough to hide this message")
    
    # 2. Modify only necessary pixels, copy rest efficiently
    # We use a mutable list for speed
    new_pixels = pixels[:] 
    
    data_index = 0
    pixel_index = 0
    
    while data_index < secret_len:
        r, g, b = new_pixels[pixel_index]
        
        # Modify R
        if data_index < secret_len:
            r = (r & ~1) | int(binary_secret[data_index])
            data_index += 1
            
        # Modify G
        if data_index < secret_len:
            g = (g & ~1) | int(binary_secret[data_index])
            data_index += 1
            
        # Modify B
        if data_index < secret_len:
            b = (b & ~1) | int(binary_secret[data_index])
            data_index += 1
            
        new_pixels[pixel_index] = (r, g, b)
        pixel_index += 1
        
    image.putdata(new_pixels)
    image.save(output_path, "PNG")

def decode_image(image_path):
    image = Image.open(image_path)
    image = image.convert("RGB")
    
    pixels = image.getdata() # Lazy iterator!
    
    binary_data = ""
    message = ""
    
    # Optimized loop: read 1 char (8 bits) at a time
    bit_buffer = []
    
    for r, g, b in pixels:
        # Extract 3 bits per pixel
        bit_buffer.extend([str(r & 1), str(g & 1), str(b & 1)])
        
        # Process every completed byte
        while len(bit_buffer) >= 8:
            byte_bits = "".join(bit_buffer[:8])
            bit_buffer = bit_buffer[8:] # Remove used bits
            
            char_code = int(byte_bits, 2)
            char = chr(char_code)
            message += char
            
            # Check for delimiter
            if message.endswith(DELIMITER):
                return message.replace(DELIMITER, "") # Found it! Stop immediately.
                
            # Safety break for huge images (e.g. 10MB of text limit)
            if len(message) > 1000000:
                print("Warning: Message too long, potential infinite loop")
                return ""
                
    return ""
