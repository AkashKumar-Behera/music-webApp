import base64
import urllib.request
import json

def test():
    try:
        from Crypto.Cipher import DES  # type: ignore
    except ImportError:
        import os
        os.system("pip3 install pycryptodome --quiet")
        from Crypto.Cipher import DES  # type: ignore

    key = b"38343638"
    enc_url = "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyZYSrL0BEigYelaWUYAWpj8YH2SR1uHt05TpItSbPKs+XqumRo6iOBBw7tS9a8Gtq"
    
    cipher = DES.new(key, DES.MODE_ECB)
    enc_bytes = base64.b64decode(enc_url)
    dec_bytes = cipher.decrypt(enc_bytes)
    pad = dec_bytes[-1]
    url = dec_bytes[:-pad].decode("utf-8")
    print("\n🎉 EXACT DECRYPTED CDN URL:", url)

    # Test 320kbps vs 160kbps vs 96kbps
    for q in ["_320.mp4", "_160.mp4", "_96.mp4"]:
        q_url = url.replace("_96.mp4", q).replace("_160.mp4", q).replace("_320.mp4", q)
        req = urllib.request.Request(q_url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"[{q}] Status: {resp.getcode()} | Size: {resp.headers.get('Content-Length')} bytes")
        except Exception as e:
            print(f"[{q}] Failed: {e}")

test()
