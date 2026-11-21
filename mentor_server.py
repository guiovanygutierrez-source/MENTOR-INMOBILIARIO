"""Servidor local del Mentor Inmobiliario con IA opcional y clave solo del lado servidor."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone
import json
import os
import threading
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
MAX_BODY = 16_000
RATE_WINDOW_SECONDS = 60
RATE_LIMIT = 12
_request_times = {}
_rate_lock = threading.Lock()
_runtime_gemini_key = ""
_gemini_key_lock = threading.Lock()


def load_project_env():
    """Load local key/value settings without overriding environment variables."""
    env_file = ROOT / ".env"
    try:
        for raw_line in env_file.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            name, value = name.strip(), value.strip().strip("\"'")
            if name and name not in os.environ:
                os.environ[name] = value
    except OSError:
        pass


load_project_env()


def configured_api_key(provider=None):
    provider = provider or ai_provider()
    if provider == "gemini":
        with _gemini_key_lock:
            return _runtime_gemini_key or os.environ.get("GEMINI_API_KEY", "").strip()
    if provider == "openai":
        return os.environ.get("OPENAI_API_KEY", "").strip()
    return ""


def validate_gemini_key(api_key):
    model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    if not model or any(char not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-" for char in model):
        raise ValueError("El modelo Gemini configurado no tiene un formato válido.")
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}",
        headers={"x-goog-api-key": api_key},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        result = json.loads(response.read().decode("utf-8"))
    if not isinstance(result, dict) or result.get("name") != f"models/{model}":
        raise ValueError("Gemini no confirmó el modelo configurado.")


def open_provider_request(request, provider, timeout=75):
    """Retry transient Gemini service outages without retrying caller errors."""
    for attempt in range(3):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except urllib.error.HTTPError as error:
            if provider != "gemini" or error.code not in {503, 504} or attempt == 2:
                raise
            time.sleep(attempt + 1)


def is_official_colombian_source(url):
    if not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        return parsed.scheme == "https" and (hostname == "gov.co" or hostname.endswith(".gov.co"))
    except ValueError:
        return False


def is_https_url(url):
    if not isinstance(url, str):
        return False
    try:
        return urlparse(url).scheme == "https" and bool(urlparse(url).hostname)
    except ValueError:
        return False


def parse_provider_result(result):
    if not isinstance(result, dict):
        raise ValueError("La API devolvió una respuesta no válida.")
    status = result.get("status")
    if status is not None and status != "completed":
        raise ValueError("La API no completó la respuesta.")
    text_parts = []
    links = []
    output = result.get("output", [])
    if not isinstance(output, list):
        output = []
    for item in output:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        contents = item.get("content", [])
        if not isinstance(contents, list):
            continue
        for content in contents:
            if not isinstance(content, dict) or content.get("type") != "output_text":
                continue
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                text_parts.append(text)
            annotations = content.get("annotations", [])
            if not isinstance(annotations, list):
                continue
            for annotation in annotations:
                if not isinstance(annotation, dict) or annotation.get("type") != "url_citation":
                    continue
                citation = annotation.get("url_citation", annotation)
                if not isinstance(citation, dict):
                    continue
                url = citation.get("url")
                if isinstance(url, str) and is_official_colombian_source(url):
                    title = citation.get("title")
                    link = {"title": title if isinstance(title, str) and title.strip() else url, "url": url}
                    if link not in links:
                        links.append(link)
    answer = "\n\n".join(text_parts).strip()
    if not answer:
        raise ValueError("La API no devolvió texto de respuesta.")
    if not links:
        answer += (
            "\n\nFUENTES Y LÍMITE\n"
            "No recibí una cita verificable de un sitio oficial colombiano (.gov.co). "
            "Trata cualquier norma, requisito, tasa o cifra vigente de esta respuesta como no confirmada "
            "y consúltala con la entidad correspondiente antes de decidir."
        )
    return {"text": answer, "links": links[:8], "mode": "ia"}


def parse_gemini_result(result, web_search_requested=False):
    """Lee texto y grounding citations de Gemini generateContent."""
    if not isinstance(result, dict):
        raise ValueError("La API devolvió una respuesta no válida.")
    candidates = result.get("candidates", [])
    if not isinstance(candidates, list) or not candidates:
        raise ValueError("La API no devolvió una respuesta completa.")
    candidate = candidates[0]
    if not isinstance(candidate, dict) or candidate.get("finishReason") not in (None, "STOP"):
        raise ValueError("La API no completó la respuesta.")
    content = candidate.get("content", {})
    parts = content.get("parts", []) if isinstance(content, dict) else []
    texts = [part["text"] for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str) and part["text"].strip()]
    answer = "\n\n".join(texts).strip()
    if not answer:
        raise ValueError("La API no devolvió texto de respuesta.")
    links = []
    metadata = candidate.get("groundingMetadata", {})
    chunks = metadata.get("groundingChunks", []) if isinstance(metadata, dict) else []
    for chunk in chunks if isinstance(chunks, list) else []:
        web = chunk.get("web", {}) if isinstance(chunk, dict) else {}
        url = web.get("uri") if isinstance(web, dict) else None
        title = web.get("title") if isinstance(web, dict) else None
        if is_https_url(url):
            link = {"title": title.strip() if isinstance(title, str) and title.strip() else url, "url": url,
                    "official": is_official_colombian_source(url)}
            if link not in links:
                links.append(link)
    if web_search_requested and not links:
        answer = ("Google no devolvió fuentes citadas para esta consulta, así que no mostraré la respuesta "
                  "generada como información de mercado verificada. Inténtalo de nuevo más tarde o desactiva "
                  "la búsqueda web si buscas una explicación general sin datos actuales.")
    return {"text": answer, "links": links[:8], "mode": "ia"}


def ai_provider():
    return os.environ.get("MENTOR_AI_PROVIDER", "gemini").strip().lower()


def build_gemini_body(history, question, web_search=False):
    instruction = (
        "Eres un mentor inmobiliario cercano, claro y honesto, especializado en Colombia. Conversa como una persona normal: "
        "responde primero a lo que te preguntan, usa frases naturales y adapta el tono al usuario. No conviertas cada respuesta "
        "en un informe ni repitas encabezados fijos; usa listas solo cuando ayuden a entender pasos o comparar opciones. "
        "Si falta un dato importante, haz una pregunta breve; no interrogues ni pidas datos personales. Sé crítico con cariño: "
        "señala riesgos y supuestos débiles sin regañar. Distingue lo que sabes de lo que estás suponiendo, pero dilo con naturalidad. "
        "Ayuda a aprender: explica términos desde cero cuando lo pidan, con ejemplos sencillos de Colombia y una pregunta corta para comprobar comprensión cuando venga al caso. "
        "No inventes leyes, tasas, precios, subsidios, cupos, requisitos, fechas ni fuentes. "
        + ("Usa Google Search para comprobar información vigente; prioriza fuentes oficiales colombianas (.gov.co), "
           "indica la fecha o vigencia cuando esté disponible y diferencia datos de fuentes comerciales. "
           "No afirmes haber verificado algo que no aparezca respaldado por las fuentes recuperadas. "
           if web_search else "No tienes búsqueda web activa: no presentes normas, tasas, programas o datos de mercado actuales como confirmados; recomienda comprobarlos en la fuente oficial pertinente. ")
        +
        "Solo afirma tener una fuente si la respuesta trae una cita verificada. Explica los límites de orientación legal o financiera y cuándo acudir a un profesional. "
        "Nunca garantices valorización, rentabilidad, aprobación ni resultados. No solicites cédulas, matrículas, claves, números de cuenta ni documentos. "
        "Cierra con el siguiente paso más útil solo cuando aporte valor; evita terminar siempre con una pregunta."
    )
    contents = []
    for item in history:
        contents.append({"role": "model" if item["role"] == "assistant" else "user", "parts": [{"text": item["content"]}]})
    contents.append({"role": "user", "parts": [{"text": question.strip()}]})
    body = {
        "systemInstruction": {"parts": [{"text": instruction}]},
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1600,
            "temperature": 0.4,
            "thinkingConfig": {"thinkingLevel": "LOW"},
        },
    }
    if web_search:
        body["tools"] = [{"google_search": {}}]
    return body


class MentorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/supabase-config":
            host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
            origin = self.headers.get("Origin", "")
            expected_port = self.server.server_address[1]
            allowed_origins = {f"http://127.0.0.1:{expected_port}", f"http://localhost:{expected_port}"}
            if host not in {"127.0.0.1", "localhost"} or (origin and origin not in allowed_origins):
                self._json(403, {"error": "Configuración no disponible para este origen."})
                return
            self._json(200, {
                "url": os.environ.get("NEXT_PUBLIC_SUPABASE_URL", os.environ.get("SUPABASE_URL", "")).strip(),
                "publishableKey": os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")).strip(),
            })
            return
        if self.path != "/api/status":
            return super().do_GET()
        host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
        origin = self.headers.get("Origin", "")
        expected_port = self.server.server_address[1]
        allowed_origins = {f"http://127.0.0.1:{expected_port}", f"http://localhost:{expected_port}"}
        if host not in {"127.0.0.1", "localhost"} or (origin and origin not in allowed_origins):
            self._json(403, {"error": "Estado no disponible para este origen."})
            return
        provider = ai_provider()
        self._json(200, {"aiConfigured": bool(configured_api_key(provider)), "provider": provider})

    def do_POST(self):
        if self.path == "/api/configure":
            self._configure_gemini()
            return
        if self.path != "/api/mentor":
            self.send_error(404)
            return
        host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
        origin = self.headers.get("Origin", "")
        expected_port = self.server.server_address[1]
        allowed_origins = {f"http://127.0.0.1:{expected_port}", f"http://localhost:{expected_port}"}
        if host not in {"127.0.0.1", "localhost"} or origin not in allowed_origins:
            self._json(403, {"error": "La consulta debe venir de esta aplicación local."})
            return
        now = time.monotonic()
        with _rate_lock:
            recent = [stamp for stamp in _request_times.get(self.client_address[0], []) if now - stamp < RATE_WINDOW_SECONDS]
            if len(recent) >= RATE_LIMIT:
                self._json(429, {"error": "Llegaste al límite temporal de consultas. Espera un minuto e inténtalo de nuevo."})
                return
            recent.append(now)
            _request_times[self.client_address[0]] = recent
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            size = 0
        if size < 1 or size > MAX_BODY:
            self._json(413, {"error": "La consulta está vacía o supera el límite permitido."})
            return
        try:
            payload = json.loads(self.rfile.read(size))
            question = payload.get("question") if isinstance(payload, dict) else None
            if not isinstance(question, str) or not question.strip() or len(question) > 5000:
                self._json(400, {"error": "Escribe una consulta de hasta 5.000 caracteres."})
                return
            raw_history = payload.get("history", [])
            web_search = payload.get("webSearch") is True
            if not isinstance(raw_history, list):
                raw_history = []
            history = []
            for item in raw_history[-4:]:
                if not isinstance(item, dict) or item.get("role") not in {"user", "mentor"}:
                    continue
                content = item.get("text")
                if isinstance(content, str) and content.strip():
                    history.append({
                        "role": "assistant" if item["role"] == "mentor" else "user",
                        "content": content.strip()[:1000],
                    })
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"error": "No pude leer la consulta."})
            return

        provider = ai_provider()
        if provider == "gemini":
            api_key = configured_api_key(provider)
            model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
        elif provider == "openai":
            api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        else:
            self._json(503, {"error": "Proveedor de IA no reconocido. Usa gemini u openai."})
            return
        if not api_key:
            self._json(503, {"error": "La IA no está configurada en este servidor. Puedes continuar con el mentor local."})
            return

        if provider == "gemini":
            request_body = build_gemini_body(history, question, web_search=web_search)
            request = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                data=json.dumps(request_body).encode("utf-8"),
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                method="POST",
            )
            parser = lambda result: parse_gemini_result(result, web_search_requested=web_search)
        else:
            request_body = {
                "model": os.environ.get("OPENAI_MODEL", "gpt-6-astra"),
                "store": False,
                "max_output_tokens": 1000,
                "tools": [{"type": "web_search", "filters": {"allowed_domains": ["gov.co"]}, "search_context_size": "medium"}],
                "tool_choice": "required",
                "instructions": "Eres un mentor inmobiliario crítico e independiente de Colombia. Responde en español claro. No inventes datos vigentes; usa búsqueda web solo en sitios .gov.co y cita las fuentes. Separa hechos y supuestos, señala riesgos y próximos pasos. No solicites datos personales ni documentos.",
                "input": [*history, {"role": "user", "content": question.strip()}],
            }
            request = urllib.request.Request(
                "https://api.openai.com/v1/responses",
                data=json.dumps(request_body).encode("utf-8"),
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                method="POST",
            )
            parser = parse_provider_result
        try:
            try:
                with open_provider_request(request, provider, timeout=45) as response:
                    result = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                if provider != "gemini" or not web_search or error.code != 429:
                    raise
                self._json(429, {"error": "Google Search no está disponible por el nivel o la cuota de esta llave. No generé una respuesta sin fuentes actuales. Desactiva la casilla web para una respuesta general o revisa la facturación y cuota de Gemini."})
                return
            payload = parser(result)
            payload["provider"] = provider
            payload["checkedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            self._json(200, payload)
        except urllib.error.HTTPError as error:
            if provider == "gemini" and error.code in {400, 401, 403}:
                message = "Gemini rechazó la llave o la solicitud. Revisa que la llave sea válida y que Gemini API esté habilitada en su proyecto."
            elif error.code == 404:
                message = "No se encontró el modelo de IA configurado. Revisa GEMINI_MODEL."
            elif error.code == 429:
                message = "El proveedor alcanzó su cuota o límite temporal. Espera e inténtalo más tarde."
            elif provider == "gemini" and error.code in {503, 504}:
                message = "Gemini no está disponible temporalmente después de varios intentos. Espera un minuto y vuelve a consultar."
            else:
                message = f"El proveedor de IA respondió con error HTTP {error.code}."
            self._json(502, {"error": message})
        except urllib.error.URLError:
            self._json(502, {"error": "No se pudo conectar con el proveedor de IA. Revisa la conexión a internet y vuelve a intentar."})
        except TimeoutError:
            self._json(502, {"error": "La consulta al proveedor de IA tardó demasiado. Inténtalo de nuevo."})
        except (ValueError, json.JSONDecodeError) as error:
            self._json(502, {"error": f"El proveedor respondió, pero no pude interpretar su respuesta: {error}"})

    def _configure_gemini(self):
        global _runtime_gemini_key
        host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
        origin = self.headers.get("Origin", "")
        expected_port = self.server.server_address[1]
        allowed_origins = {f"http://127.0.0.1:{expected_port}", f"http://localhost:{expected_port}"}
        if host not in {"127.0.0.1", "localhost"} or origin not in allowed_origins:
            self._json(403, {"error": "La llave solo se puede configurar desde esta app local."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            size = 0
        if size < 1 or size > 4096:
            self._json(400, {"error": "Ingresa una llave Gemini válida."})
            return
        try:
            payload = json.loads(self.rfile.read(size))
            api_key = payload.get("apiKey") if isinstance(payload, dict) else None
            if not isinstance(api_key, str) or not api_key.strip() or len(api_key.strip()) > 1024:
                self._json(400, {"error": "Ingresa una llave Gemini válida."})
                return
            api_key = api_key.strip()
            validate_gemini_key(api_key)
            with _gemini_key_lock:
                _runtime_gemini_key = api_key
            self._json(200, {"ok": True, "aiConfigured": True, "provider": "gemini"})
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"error": "No pude leer la llave."})
        except urllib.error.HTTPError as error:
            if error.code in {400, 401, 403}:
                message = "Google rechazó la llave. Comprueba en AI Studio que siga activa y que tenga acceso a Gemini API."
            elif error.code == 404:
                message = "El modelo Gemini configurado no está disponible para esta API key."
            elif error.code == 429:
                message = "Google limitó temporalmente la validación. Espera un momento y vuelve a intentar."
            else:
                message = f"Google respondió con error HTTP {error.code} al validar la llave."
            self._json(502, {"error": message})
        except urllib.error.URLError:
            self._json(502, {"error": "No pude comunicarme con Google para validar la llave. Revisa tu conexión."})
        except (TimeoutError, ValueError, json.JSONDecodeError):
            self._json(502, {"error": "No pude validar la llave con Gemini. Revisa la llave y vuelve a intentar."})

    def _json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(data)


def main():
    try:
        preferred = int(os.environ.get("MENTOR_PORT", "8765"))
    except ValueError:
        preferred = 8765
    if not 1024 <= preferred <= 65535:
        preferred = 8765
    server = None
    for port in [preferred, *range(preferred + 1, min(preferred + 21, 65536))]:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), MentorHandler)
            break
        except OSError:
            continue
    if server is None:
        raise OSError("No encontré un puerto libre entre el puerto preferido y los siguientes 20.")
    print(f"Mentor Inmobiliario: http://127.0.0.1:{server.server_address[1]}/")
    print(f"La clave del proveedor {ai_provider()} se lee desde el entorno y nunca se envía al navegador.")
    print("Ctrl+C detiene el servidor.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
