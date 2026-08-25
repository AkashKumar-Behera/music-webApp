import urllib.request
import json
import base64
from Crypto.Cipher import DES

def test_web_ctx(query):
    url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&query={urllib.parse.quote(query)}&_format=json&_marker=0&ctx=web6dot0"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        first = data['songs']['data'][0]
        song_id = first['id']
        print(f"Song: {first['title']} ({song_id})")
        
        durl = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={song_id}&_format=json&_marker=0&ctx=web6dot0"
        dreq = urllib.request.Request(durl, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(dreq) as dresp:
            details = json.loads(dresp.read().decode('utf-8'))
            obj = details[song_id]
            enc_media_url = obj.get('encrypted_media_url')
            print("Encrypted media URL:", enc_media_url)
            
            if enc_media_url:
                key = b"38343638"
                cipher = DES.new(key, DES.MODE_ECB)
                dec = cipher.decrypt(base64.b64decode(enc_media_url))
                pad = dec[-1]
                dec_url = dec[:-pad].decode('utf-8')
                print("DECRYPTED MEDIA URL:", dec_url)

test_web_ctx("Despacito")
test_web_ctx("Kesariya")
