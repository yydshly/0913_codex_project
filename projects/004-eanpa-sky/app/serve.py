"""Serve pinned Eanpa rendering with a local bilingual UI and practice journal."""
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from hashlib import sha1
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit, quote
from urllib.request import Request, urlopen
import argparse
import io
import json
import mimetypes
import threading
import time

APP = Path(__file__).resolve().parent
LOCK = json.loads((APP / 'upstream-lock.json').read_text(encoding='utf-8-sig'))
COMMIT = LOCK['commit']
CACHE = APP / '.cache' / COMMIT
BASE = f'https://raw.githubusercontent.com/SkyeShark/Eanpa-Sky/{COMMIT}/'
GATES = {name: threading.Lock() for name in LOCK['files']}
VERIFIED = set()
DOWNLOADS = threading.Semaphore(8)
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/wasm', '.wasm')


def valid(data, expected):
    header = f'blob {len(data)}\0'.encode()
    return len(data) == expected['size'] and sha1(header + data).hexdigest() == expected['sha']


def ensure_file(name):
    expected = LOCK['files'][name]
    target = CACHE.joinpath(*name.split('/'))
    with GATES[name]:
        if name in VERIFIED and target.is_file():
            return target
        if target.is_file() and valid(target.read_bytes(), expected):
            VERIFIED.add(name)
            return target
        error = None
        for attempt in range(3):
            try:
                with DOWNLOADS:
                    request = Request(BASE + quote(name), headers={'User-Agent': 'Eanpa-Research-004'})
                    with urlopen(request, timeout=120) as response:
                        data = response.read()
                if not valid(data, expected):
                    raise ValueError(f'Upstream content does not match pinned Git blob: {name}')
                target.parent.mkdir(parents=True, exist_ok=True)
                pending = target.with_name(target.name + '.partial')
                pending.write_bytes(data)
                pending.replace(target)
                VERIFIED.add(name)
                print(f'cached {name} ({len(data)} bytes)', flush=True)
                return target
            except Exception as exc:
                error = exc
                time.sleep(attempt + 1)
        raise error


class Handler(SimpleHTTPRequestHandler):
    def local_response(self, data, content_type):
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        return io.BytesIO(data)

    def do_POST(self):
        # Upstream mirrors its console to this loopback-only development endpoint.
        if self.path != '/__log':
            self.send_error(404)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            self.send_error(400)
            return
        if not 0 <= size <= 65536:
            self.send_error(413)
            return
        payload = self.rfile.read(size)
        with (APP / '.cache' / 'browser-console.log').open('ab') as handle:
            handle.write(payload.rstrip(b'\n') + b'\n')
        self.send_response(204)
        self.end_headers()

    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith('/lab-audio/'):
            name = path.removeprefix('/lab-audio/')
            target = APP.parent / 'assets' / 'audio' / name
            if name not in {'rain-garden.ogg', 'thunder-natural.ogg'} or not target.is_file():
                self.send_error(404)
                return None
            return self.local_response(target.read_bytes(), 'audio/ogg')
        if path == '/lab/resource-sizes.json':
            sizes = {'/' + name: info['size'] for name, info in LOCK['files'].items()}
            for file in (APP / 'lab').glob('*'):
                if file.is_file():
                    sizes['/lab/' + file.name] = file.stat().st_size
            sizes['/lab/'] = sizes.get('/lab/index.html', 0)
            for file in (APP.parent / 'assets' / 'audio').glob('*.ogg'):
                sizes['/lab-audio/' + file.name] = file.stat().st_size
            return self.local_response(json.dumps(sizes).encode(), 'application/json')
        if path.startswith('/lab/'):
            name = path.removeprefix('/lab/') or 'index.html'
            target = APP / 'lab' / name
            if '/' in name or '\\' in name or target.suffix not in {'.html', '.css', '.js', '.json', '.txt'} or not target.is_file():
                self.send_error(404)
                return None
            return self.local_response(target.read_bytes(), self.guess_type(str(target)))
        local_files = {
            '/practice/': ('practice.html', 'text/html; charset=utf-8'),
            '/research-ui.js': ('research-ui.js', 'application/javascript'),
            '/research-ui.css': ('research-ui.css', 'text/css'),
            '/practice.js': ('practice.js', 'application/javascript'),
            '/practice.css': ('practice.css', 'text/css'),
            '/resource-report.json': ('resource-report.json', 'application/json'),
        }
        if path in local_files:
            filename, content_type = local_files[path]
            return self.local_response((APP / filename).read_bytes(), content_type)
        if path.startswith('/research-assets/'):
            name = path.removeprefix('/research-assets/')
            target = APP.parent / 'assets' / name
            if '/' in name or '\\' in name or not name.endswith('.jpg') or not target.is_file():
                self.send_error(404)
                return None
            return self.local_response(target.read_bytes(), 'image/jpeg')
        if path == '/__research/status':
            payload = json.dumps({'project': '004-eanpa-sky', 'commit': COMMIT,
                                  'cachedFiles': len(VERIFIED)}, indent=2).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(payload)
            return None
        name = 'index.html' if path in ('/', '/original/') else path.lstrip('/')
        if name not in LOCK['files']:
            self.send_error(404, 'Not in the pinned upstream manifest')
            return None
        try:
            target = ensure_file(name)
        except Exception as exc:
            print(f'DOWNLOAD FAILED {name}: {exc}', flush=True)
            self.send_error(502, 'Upstream fetch failed; see local server log and retry')
            return None
        if name == 'index.html':
            html = target.read_text(encoding='utf-8')
            if path == '/original/':
                html = html.replace('<head>', '<head><base href="/">', 1)
            else:
                html = html.replace('</head>', '<link rel="stylesheet" href="/research-ui.css"></head>')
                html = html.replace('</body>', '<script type="module" src="/research-ui.js"></script></body>')
            return self.local_response(html.encode('utf-8'), 'text/html; charset=utf-8')
        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(str(target)))
        self.send_header('Content-Length', str(target.stat().st_size))
        self.send_header('Cache-Control', 'public, max-age=3600')
        self.send_header('X-Upstream-Commit', COMMIT)
        self.end_headers()
        return target.open('rb')


class Server(ThreadingHTTPServer):
    request_queue_size = 128


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8044)
    parser.add_argument('--prefetch-code', action='store_true', help='Cache code before starting')
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    if args.prefetch_code:
        names = [name for name in LOCK['files'] if not name.startswith('assets/')]
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(ensure_file, names))
    server = Server(('127.0.0.1', args.port), partial(Handler, directory=str(CACHE)))
    print(f'Eanpa Sky {LOCK["version"]} / {COMMIT}\nhttp://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
