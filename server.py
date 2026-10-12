"""GAME HUB local server — shuts itself down when the app window closes.

Every page sends a heartbeat (/__ping) every 5s, announces itself (/__hi)
on load and says goodbye (/__bye) when the window/tab closes. When no pages
are open for ~12s (or no heartbeat at all for 5 min), the server exits, so
closing the app window also closes the server console.
"""
import http.server
import socketserver
import threading
import time
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8123
GRACE = 30          # seconds after start before shutdown checks begin
IDLE_EXIT = 12      # seconds with zero open pages -> exit
HARD_TIMEOUT = 300  # seconds with no heartbeat at all -> exit (crash backstop)

last_beat = [time.time()]
open_pages = [0]
lock = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    def _ctl(self):
        with lock:
            if '__hi' in self.path:
                open_pages[0] += 1
            elif '__bye' in self.path:
                open_pages[0] = max(0, open_pages[0] - 1)
            last_beat[0] = time.time()
        self.send_response(204)
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/__'):
            self._ctl()
            return
        last_beat[0] = time.time()
        super().do_GET()

    def do_POST(self):  # sendBeacon uses POST
        if self.path.startswith('/__'):
            self._ctl()
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *args):
        pass


def watchdog(httpd):
    time.sleep(GRACE)
    idle_since = None
    while True:
        time.sleep(2)
        now = time.time()
        with lock:
            pages = open_pages[0]
            beat = last_beat[0]
        if now - beat > HARD_TIMEOUT:
            break
        if pages <= 0:
            if idle_since is None:
                idle_since = now
            elif now - idle_since > IDLE_EXIT:
                break
        else:
            idle_since = None
    print('GameHub closed — shutting down server.')
    httpd.shutdown()


def main():
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    try:
        httpd = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Handler)
    except OSError:
        sys.exit(0)  # already running
    threading.Thread(target=watchdog, args=(httpd,), daemon=True).start()
    print('GameHub server on http://localhost:%d — closes automatically with the app window.' % PORT)
    httpd.serve_forever()


if __name__ == '__main__':
    main()
