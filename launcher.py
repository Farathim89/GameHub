"""GAME HUB — desktop launcher (packaged into GameHub.exe with PyInstaller).

Starts a tiny local web server for the game files and opens the hub in an
app-style browser window (Chrome -> Edge -> default). The server shuts itself
down a few seconds after the last window closes, so closing the app also ends
the background process.

Web root resolution (so games stay editable after packaging):
  1) the folder the .exe sits in, if it contains index.html  (portable folder)
  2) the copy bundled inside the .exe (PyInstaller _MEIPASS)   (standalone exe)
  3) the folder this script lives in                           (running from source)
"""
import http.server
import socketserver
import threading
import time
import os
import sys
import subprocess
import webbrowser

PORT = 8123
URL = "http://localhost:%d/index.html" % PORT
GRACE = 30          # seconds after start before shutdown checks begin
IDLE_EXIT = 12      # seconds with zero open pages -> exit
HARD_TIMEOUT = 300  # seconds with no heartbeat at all -> exit (crash backstop)


def web_root():
    """Find the folder that holds index.html / the games."""
    candidates = []
    if getattr(sys, "frozen", False):
        candidates.append(os.path.dirname(sys.executable))      # next to the exe
        meipass = getattr(sys, "_MEIPASS", None)
        if meipass:
            candidates.append(meipass)                          # bundled copy
    candidates.append(os.path.dirname(os.path.abspath(__file__)))
    for c in candidates:
        if c and os.path.isfile(os.path.join(c, "index.html")):
            return c
    return candidates[0] if candidates else os.getcwd()


ROOT = web_root()

last_beat = [time.time()]
open_pages = [0]
lock = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _ctl(self):
        with lock:
            if "__hi" in self.path:
                open_pages[0] += 1
            elif "__bye" in self.path:
                open_pages[0] = max(0, open_pages[0] - 1)
            last_beat[0] = time.time()
        self.send_response(204)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/__"):
            self._ctl()
            return
        last_beat[0] = time.time()
        super().do_GET()

    def do_POST(self):  # sendBeacon uses POST
        if self.path.startswith("/__"):
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
    try:
        httpd.shutdown()
    except Exception:
        pass
    os._exit(0)


def find_chrome():
    paths = [
        os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"),
                     r"Google\Chrome\Application\chrome.exe"),
        os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                     r"Google\Chrome\Application\chrome.exe"),
        os.path.join(os.environ.get("LocalAppData", ""),
                     r"Google\Chrome\Application\chrome.exe"),
    ]
    for p in paths:
        if p and os.path.isfile(p):
            return p
    return None


def find_edge():
    paths = [
        os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                     r"Microsoft\Edge\Application\msedge.exe"),
        os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"),
                     r"Microsoft\Edge\Application\msedge.exe"),
    ]
    for p in paths:
        if p and os.path.isfile(p):
            return p
    return None


def open_window():
    # headless mode: start the server but do not open a browser window
    if os.environ.get("GAMEHUB_NO_WINDOW") == "1":
        return
    # dedicated app-mode profile so it opens as its own window, not a new tab
    profile = os.path.join(os.environ.get("LocalAppData", os.path.expanduser("~")),
                           "GameHub", "browser")
    chrome = find_chrome() or find_edge()
    if chrome:
        try:
            subprocess.Popen([chrome, "--app=" + URL,
                              "--user-data-dir=" + profile,
                              "--no-first-run", "--no-default-browser-check"])
            return
        except Exception:
            pass
    try:
        webbrowser.open(URL)
    except Exception:
        pass


def main():
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = None
    try:
        httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        # a server is already running on this port -> just open the window
        open_window()
        return
    threading.Thread(target=watchdog, args=(httpd,), daemon=True).start()
    threading.Timer(1.0, open_window).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
