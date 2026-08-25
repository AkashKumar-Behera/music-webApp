import base64
import urllib.parse
import json
import urllib.request

# Pure Python DES ECB Decryption for JioSaavn encrypted_media_url (key: b"38343638")
# Since standard DES is simple 8-byte block ECB, let's write or import
try:
    from Crypto.Cipher import DES
    def decrypt_url(enc_b64):
        key = b'38343638'
        cipher = DES.new(key, DES.MODE_ECB)
        enc = base64.b64decode(enc_b64)
        dec = cipher.decrypt(enc)
        pad = dec[-1]
        return dec[:-pad].decode('utf-8')
except ImportError:
    # Use pycryptodome or openssl cli
    import subprocess
    def decrypt_url(enc_b64):
        res = subprocess.run([
            'openssl', 'enc', '-d', '-des-ecb', '-K', '3338333433363338', '-nosalt', '-base64', '-A'
        ], input=enc_b64.encode('utf-8'), capture_output=True)
        return res.stdout.decode('utf-8', errors='ignore').strip()

def test_des():
    enc = "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyZYSrL0BEigYelaWUYAWpj8YH2SR1uHt05TpItSbPKs+XqumRo6iOBBw7tS9a8Gtq"
    dec = decrypt_url(enc)
    print("DECRYPTED MEDIA URL:", dec)
    url_320 = dec.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4")
    if not "_320.mp4" in url_320 and not "_160.mp4" in url_320:
        url_320 = url_320.replace(".mp4", "_320.mp4")
    print("320KBPS STREAM URL:", url_320)

test_des()
