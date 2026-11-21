from http.server import BaseHTTPRequestHandler
from datetime import datetime, timezone
import json
import os
import re
import urllib.error
import urllib.request

from mentor_server import build_gemini_body, parse_gemini_result

MAX_BODY = 16000

class handler(BaseHTTPRequestHandler):
    def _json(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        web_search = False
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size < 1 or size > MAX_BODY:
                return self._json(413, {'error': 'La consulta está vacía o supera el límite permitido.'})
            data = json.loads(self.rfile.read(size))
            question = data.get('question') if isinstance(data, dict) else None
            if not isinstance(question, str) or not question.strip() or len(question) > 5000:
                return self._json(400, {'error': 'Escribe una consulta de hasta 5.000 caracteres.'})
            # An explicitly supplied BYOK key takes precedence. Never log it or
            # include it in a response; Vercel functions are stateless.
            key = self.headers.get('x-gemini-api-key', '').strip()
            if not key:
                key = os.environ.get('GEMINI_API_KEY', '').strip()
            if not key:
                return self._json(503, {'error': 'Conecta una llave API de Gemini en Mi mentor para activar la IA.'})
            if len(key) > 512 or any(ord(char) < 32 for char in key):
                return self._json(400, {'error': 'La llave de Gemini no tiene un formato válido.'})
            web_search = data.get('webSearch') is True
            raw_history = data.get('history', [])
            history = []
            if isinstance(raw_history, list):
                for item in raw_history[-4:]:
                    if isinstance(item, dict) and item.get('role') in ('user', 'mentor') and isinstance(item.get('text'), str):
                        history.append({'role': 'assistant' if item['role'] == 'mentor' else 'user', 'content': item['text'][:1000]})
            body = build_gemini_body(history, question.strip(), web_search=web_search)
            model = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite').strip()
            req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', data=json.dumps(body).encode(), headers={'x-goog-api-key': key, 'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=55) as response:
                result = json.loads(response.read().decode())
            parsed = parse_gemini_result(result, web_search_requested=web_search)
            parsed['provider'] = 'gemini'
            parsed['checkedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
            return self._json(200, parsed)
        except urllib.error.HTTPError as error:
            code = 429 if error.code == 429 else 502
            message = 'Google Search no está disponible por cuota o facturación.' if error.code == 429 and web_search else f'Gemini respondió con error HTTP {error.code}.'
            return self._json(code, {'error': message})
        except urllib.error.URLError:
            return self._json(502, {'error': 'No se pudo conectar con Gemini.'})
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {'error': 'No pude interpretar la consulta.'})
