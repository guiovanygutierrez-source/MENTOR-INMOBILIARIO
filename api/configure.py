from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.error
import urllib.request

MAX_KEY_LENGTH = 512

def response(handler, status, value):
    body = json.dumps(value, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Cache-Control', 'no-store, private')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('X-Content-Type-Options', 'nosniff')
    handler.end_headers()
    handler.wfile.write(body)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        key = self.headers.get('x-gemini-api-key', '').strip()
        if not key or len(key) > MAX_KEY_LENGTH or any(ord(char) < 32 for char in key):
            return response(self, 400, {'error': 'Pega una llave Gemini válida.'})
        model = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite').strip()
        request = urllib.request.Request(
            f'https://generativelanguage.googleapis.com/v1beta/models/{model}',
            headers={'x-goog-api-key': key}, method='GET')
        try:
            with urllib.request.urlopen(request, timeout=12) as upstream:
                if upstream.status != 200:
                    return response(self, 502, {'error': 'Google no pudo validar la llave.'})
            return response(self, 200, {'ok': True})
        except urllib.error.HTTPError as error:
            if error.code in (401, 403):
                return response(self, 401, {'error': 'Google rechazó la llave. Verifica que sea correcta y tenga Gemini API habilitada.'})
            if error.code == 429:
                return response(self, 429, {'error': 'Google limitó la validación por cuota. Inténtalo más tarde.'})
            return response(self, 502, {'error': 'Google no pudo validar la llave en este momento.'})
        except (urllib.error.URLError, TimeoutError):
            return response(self, 502, {'error': 'No se pudo conectar con Google para validar la llave.'})
