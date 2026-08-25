import urllib.request
import json
import base64
import sys

try:
    from Crypto.Cipher import DES
except ImportError:
    DES = None

def get_song(query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&query={encoded_query}&_format=json&_marker=0&ctx=android"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        songs = data.get('songs', {}).get('data', [])
        if not songs:
            print("No songs found")
            return None
        first = songs[0]
        song_id = first.get('id')
        print(f"Found song: {first.get('title')} (ID: {song_id})")
        
        # Get details
        details_url = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={song_id}&_format=json&_marker=0&ctx=android"
        dreq = urllib.request.Request(details_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(dreq) as dresp:
            details = json.loads(dresp.read().decode('utf-8'))
            song_obj = details.get(song_id, {})
            more_info = song_obj.get('more_info', {})
            enc_url = more_info.get('encrypted_media_url')
            print(f"Encrypted Media URL: {enc_url}")
            
            # Auth token / direct link
            if enc_url:
                auth_url = f"https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url={urllib.parse.quote(enc_url)}&bitrate=320&_format=json&_marker=0&ctx=android"
                areq = urllib.request.Request(auth_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(areq) as aresp:
                    auth_data = json.loads(aresp.read().decode('utf-8'))
                    print(f"Auth Data: {auth_data}")
                    auth_media_url = auth_data.get('auth_url')
                    print(f"DIRECT STREAM URL: {auth_media_url}")
                    return auth_media_url

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "Despacito"
    get_song(q)
