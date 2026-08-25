import base64
from Crypto.Cipher import DES

def test_path():
    key = b"38343638"
    cipher = DES.new(key, DES.MODE_ECB)
    
    p = "NMKyboFo/FjQNfWMrQEuYCc4FfklYiBiad5xNzLN09NiK8i1KHIs/e+iWZ1xOJZz"
    raw_enc = base64.b64decode(p)
    dec = cipher.decrypt(raw_enc)
    print("HEX:", dec.hex())
    print("BYTES:", list(dec))
    print("STRING:", dec.decode('utf-8', errors='ignore'))

test_path()
