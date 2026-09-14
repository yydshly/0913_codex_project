"""Rebuild the local disk-cache report without downloading upstream files."""
from collections import defaultdict
from datetime import date
from hashlib import sha1
from pathlib import Path
import json

app = Path(__file__).resolve().parent
lock = json.loads((app / 'upstream-lock.json').read_text(encoding='utf-8-sig'))
cache = app / '.cache' / lock['commit']
groups = defaultdict(lambda: {'bytes': 0, 'files': 0})
files = []
for path in cache.rglob('*'):
    if not path.is_file():
        continue
    name = path.relative_to(cache).as_posix()
    if name not in lock['files']:
        continue
    data = path.read_bytes()
    expected = lock['files'][name]
    if len(data) != expected['size'] or sha1(f'blob {len(data)}\0'.encode() + data).hexdigest() != expected['sha']:
        raise ValueError(f'Cache content does not match pinned version: {name}')
    group = '/'.join(name.split('/')[:2]) if name.startswith('assets/') else name.split('/')[0]
    groups[group]['bytes'] += len(data)
    groups[group]['files'] += 1
    files.append({'path': name, 'bytes': len(data)})
if not files:
    raise RuntimeError('No verified cached files yet. Run the demo first.')
report = {
    'date': date.today().isoformat(), 'commit': lock['commit'],
    'scope': 'Verified files in local disk cache; not RAM, VRAM, or a single page transfer.',
    'bytes': sum(g['bytes'] for g in groups.values()),
    'files': sum(g['files'] for g in groups.values()),
    'groups': [{'path': name, **g} for name, g in sorted(groups.items(), key=lambda x: -x[1]['bytes'])],
    'largest': sorted(files, key=lambda f: -f['bytes'])[:12],
}
(app / 'resource-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{report["files"]} verified files; {report["bytes"]:,} bytes ({report["bytes"] / 1048576:.1f} MiB)')
