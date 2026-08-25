import urllib.request
import json
import urllib.parse

def inspect(query):
    url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&query={urllib.parse.quote(query)}&_format=json&_marker=0&ctx=android"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        first = data['songs']['data'][0]
        print("Autocomplete song item keys:", first.keys())
        print("More info:", first.get('more_info', {}))
        
        # Details call by pids
        durl = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={first['id']}&_format=json&_marker=0&ctx=android"
        dreq = urllib.request.Request(durl, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(dreq) as dresp:
            details = json.loads(dresp.read().decode('utf-8'))
            print("Details keys:", details.keys())
            for k, v in details.items():
                print(f"Key {k} keys:", v.keys() if isinstance(v, dict) else v)
                if isinstance(v, dict) and 'encrypted_media_url' in v:
                    print("Found encrypted_media_url directly in root:", v['encrypted_media_url'])
                if isinstance(v, dict) and 'media_preview_url' in v:
                    print("Found media_preview_url:", v['media_preview_url'])

inspect("Despacito")
