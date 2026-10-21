#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = r"F:\webflacplayer"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Mengizinkan CORS agar Web Audio API dan Equalizer berjalan sempurna di mode offline
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

def run():
    if not os.path.exists(DIRECTORY):
        print(f"Error: Folder {DIRECTORY} tidak ditemukan!")
        return

    os.chdir(DIRECTORY)
    Handler = CustomHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 65)
        print(f" 🎵 WebFlacPlayer (Moedev) aktif di F:\\webflacplayer")
        print(f" 🚀 Buka browser: http://127.0.0.1:{PORT}")
        print(f" Tekan Ctrl+C di terminal untuk mematikan server.")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer offline dimatikan. Selamat beristirahat!")

if __name__ == "__main__":
    run()