"""Fetch only the sixteen used components and their relative imports at a fixed commit."""
from pathlib import Path
import hashlib, json, re, urllib.request, posixpath

SHA = '44de3787b77d78477a7c03a4c81a7d5ea317cdbc'
BASE = f'https://raw.githubusercontent.com/DavidHDev/canvas-ui/{SHA}/'
ROOT = Path(__file__).resolve().parents[1] / 'src' / 'vendor'
NAMES = ['Liquid', 'Blaze', 'Glass', 'Shatter', 'ParticleReveal', 'VHS',
         'Ripple', 'Droplets', 'Clouds', 'Laser', 'Bubble', 'ForceField',
         'GlyphRain', 'Frost', 'FlameWrap', 'HexFloat']
records = {}
previous = json.loads((ROOT / 'sources.json').read_text())['files'] if (ROOT / 'sources.json').exists() else {}

def fetch(path):
    if path in records:
        return
    target = ROOT / path.removeprefix('src/lib/')
    cached = target.read_bytes() if target.exists() else b''
    record = previous.get(path, {})
    data = cached if record.get('url') == BASE + path and hashlib.sha256(cached).hexdigest() == record.get('sha256') else urllib.request.urlopen(BASE + path, timeout=30).read()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    records[path] = {'url': BASE + path, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    source = data.decode('utf-8')
    for dep in re.findall(r'from\s+[\"\'](\.[^\"\']+)[\"\']', source):
        dep = posixpath.normpath(posixpath.join(posixpath.dirname(path), dep))
        if not posixpath.splitext(dep)[1]:
            dep += '.ts'
        fetch(dep)

for name in NAMES:
    fetch(f'src/lib/{name}/{name}.tsx')
(ROOT / 'sources.json').write_text(json.dumps({'commit': SHA, 'fetched': '2026-09-14', 'files': records}, indent=2))
print(f'Fetched {len(records)} files, {sum(x["bytes"] for x in records.values())} bytes.')
