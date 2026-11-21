from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
        key = os.environ.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '').strip()
        status = 200 if url and key else 503
        payload = {'url': url, 'publishableKey': key} if status == 200 else {'error': 'Configura las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en Vercel.'}
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
