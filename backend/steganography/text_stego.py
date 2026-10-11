import re

# Invisible characters
ZERO_WIDTH_SPACE = "\u200b"       # represents 0
ZERO_WIDTH_NON_JOINER = "\u200c"  # represents 1

# Delimiter to signal end of message
DELIMITER = "#####"


# ---------------- ENCODE ----------------
def encode_text(cover_text, secret_text):
    # 1. Prepare message with delimiter
    full_secret = secret_text + DELIMITER
    
    # 2. Convert to binary string
    binary = ''.join(format(ord(c), '08b') for c in full_secret)
    
    # 3. Use list comprehension for efficient string building
    hidden_chars = [ZERO_WIDTH_SPACE if bit == '0' else ZERO_WIDTH_NON_JOINER for bit in binary]
    
    # 4. Append to cover text
    return cover_text + "".join(hidden_chars)


# ---------------- DECODE ----------------
def decode_text(stego_text):
    # 1. Extract zero-width chars using Regex (Fast C implementation)
    hidden_chars = re.findall(f"[{ZERO_WIDTH_SPACE}{ZERO_WIDTH_NON_JOINER}]", stego_text)
    
    if not hidden_chars:
        return ""
        
    # 2. Convert back to binary string
    binary_list = ['0' if c == ZERO_WIDTH_SPACE else '1' for c in hidden_chars]
    binary = "".join(binary_list)
    
    # 3. Convert to characters
    chars = []
    message = ""
    
    for i in range(0, len(binary), 8):
        byte = binary[i:i+8]
        if len(byte) == 8:
            char_code = int(byte, 2)
            char = chr(char_code)
            message += char
            
            # Check for delimiter (efficiently check suffix)
            if message.endswith(DELIMITER):
                return message[:-len(DELIMITER)]
                
    # If no delimiter found (legacy formats or corruption), return whatever we got
    return message
