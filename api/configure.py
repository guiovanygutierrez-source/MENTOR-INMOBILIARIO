from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.dumps({'error': 'En Vercel, configura GEMINI_API_KEY en Settings > Environment Variables. No pegues la llave aquí.'}).encode()
        self.send_response(409)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
