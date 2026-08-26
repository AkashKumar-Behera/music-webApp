import urllib.request
import urllib.parse
import json
import base64
from Crypto.Cipher import DES  # type: ignore

def test(query):
    url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&query={urllib.parse.quote(query)}&_format=json&_marker=0&ctx=web6dot0"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        first = data['songs']['data'][0]
        song_id = first['id']
        
        durl = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={song_id}&_format=json&_marker=0&ctx=web6dot0"
        dreq = urllib.request.Request(durl, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(dreq) as dresp:
            details = json.loads(dresp.read().decode('utf-8'))
            obj = details.get(song_id) or (details.get('songs') and details['songs'][0]) or details
            enc = obj.get('encrypted_media_url')
            
            key = b"38343638"
            cipher = DES.new(key, DES.MODE_ECB)
            dec = cipher.decrypt(base64.b64decode(enc))
            print("\nDecrypted Raw String:", repr(dec.decode('utf-8', errors='ignore')))

test("Despacito")
test("Kesariya")
test("Believer")
