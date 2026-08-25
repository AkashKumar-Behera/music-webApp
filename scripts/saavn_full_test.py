import urllib.request
import urllib.parse
import json
import base64

def test_song(title):
    print(f"\n--- Testing song: {title} ---")
    enc = urllib.parse.quote(title)
    url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&query={enc}&_format=json&_marker=0&ctx=android"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            songs = data.get('songs', {}).get('data', [])
            if not songs:
                print("No songs found")
                return
            first = songs[0]
            song_id = first['id']
            print(f"Found: {first['title']} (ID: {song_id})")
            
            # Details
            durl = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={song_id}&_format=json&_marker=0&ctx=android"
            dreq = urllib.request.Request(durl, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(dreq) as dresp:
                details = json.loads(dresp.read().decode('utf-8'))
                s_obj = details.get(song_id, {})
                for k, v in s_obj.items():
                    if 'url' in k.lower() or 'media' in k.lower() or 'link' in k.lower():
                        print(f"  {k}: {str(v)[:80]}")
    except Exception as e:
        print(f"Error: {e}")

test_song("Kesariya")
test_song("Believer")
test_song("Tum Hi Ho")
