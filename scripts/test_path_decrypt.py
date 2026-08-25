import base64
from Crypto.Cipher import DES

def test_path():
    key = b"38343638"
    cipher = DES.new(key, DES.MODE_ECB)
    
    paths = [
        "NMKyboFo/FjQNfWMrQEuYCc4FfklYiBiad5xNzLN09NiK8i1KHIs/e+iWZ1xOJZz",
        "NMKyboFo/Fgq6gy2NqzY+xzczltkq0df28DwCrfDkiJA7esevOtwvMGx4KNKuNMB",
        "NMKyboFo/FhmH0BSVeW2WJHZWovAlOK7NfaTljfkc+ByaNkO5bI4NIORKa0B2Chl"
    ]
    
    for p in paths:
        dec = cipher.decrypt(base64.b64decode(p))
        pad = dec[-1]
        clean = dec[:-pad].decode('utf-8')
        print("Decrypted Path:", clean)
        print("Full CDN URL 320:", f"https://aac.saavncdn.com/{clean}.mp4")
        print("Full CDN URL 160:", f"https://aac.saavncdn.com/{clean}_160.mp4")
        print("Full CDN URL 96:", f"https://aac.saavncdn.com/{clean}_96.mp4")

test_path()
