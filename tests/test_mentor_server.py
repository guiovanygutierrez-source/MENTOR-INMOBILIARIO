import unittest
import json
import urllib.error
import urllib.request
from io import BytesIO
from unittest.mock import patch

import mentor_server
from mentor_server import MentorHandler, build_gemini_body, configured_api_key, is_official_colombian_source, open_provider_request, parse_gemini_result, parse_provider_result, validate_gemini_key


class FakeConfigureHandler:
    def __init__(self, api_key, origin="http://127.0.0.1:8765"):
        body = json.dumps({"apiKey": api_key}).encode("utf-8")
        self.headers = {"Host": "127.0.0.1:8765", "Origin": origin, "Content-Length": str(len(body))}
        self.rfile = BytesIO(body)
        self.path = "/api/configure"
        self.server = type("Server", (), {"server_address": ("127.0.0.1", 8765)})()
        self.result = None

    def _json(self, status, payload):
        self.result = (status, payload)


class FakeMentorRequestHandler:
    def __init__(self, payload):
        body = json.dumps(payload).encode("utf-8")
        self.headers = {
            "Host": "127.0.0.1:8765",
            "Origin": "http://127.0.0.1:8765",
            "Content-Length": str(len(body)),
        }
        self.rfile = BytesIO(body)
        self.path = "/api/mentor"
        self.server = type("Server", (), {"server_address": ("127.0.0.1", 8765)})()
        self.client_address = ("127.0.0.1", 12345)
        self.result = None

    def _json(self, status, payload):
        self.result = (status, payload)


def output_with_citations(citations):
    return {
        "output": [{
            "type": "message",
            "content": [{
                "type": "output_text",
                "text": "Revisa el requisito vigente antes de decidir.",
                "annotations": [
                    {"type": "url_citation", "url": url, "title": title}
                    for url, title in citations
                ],
            }],
        }],
    }


class ProviderResultTests(unittest.TestCase):
    def test_grounding_quota_returns_notice_without_unverified_retry(self):
        request_handler = FakeMentorRequestHandler({
            "question": "Compara los mercados inmobiliarios actuales.",
            "webSearch": True,
        })
        quota = urllib.error.HTTPError("https://example.test", 429, "quota", {}, None)
        with patch.dict("os.environ", {"MENTOR_AI_PROVIDER": "gemini"}), \
             patch.object(mentor_server, "_runtime_gemini_key", "test-key"), \
             patch.object(mentor_server, "_request_times", {}), \
             patch("mentor_server.open_provider_request", side_effect=quota) as provider_call:
            MentorHandler.do_POST(request_handler)
        self.assertEqual(request_handler.result[0], 429)
        self.assertIn("No generé una respuesta sin fuentes actuales", request_handler.result[1]["error"])
        provider_call.assert_called_once()
        sent = json.loads(provider_call.call_args.args[0].data.decode("utf-8"))
        self.assertEqual(sent["tools"], [{"google_search": {}}])

    def test_gemini_503_is_retried_and_recovers(self):
        outage = urllib.error.HTTPError("https://example.test", 503, "busy", {}, None)
        response = object()
        request = urllib.request.Request("https://example.test")
        with patch("mentor_server.urllib.request.urlopen", side_effect=[outage, response]) as urlopen:
            with patch("mentor_server.time.sleep") as sleep:
                self.assertIs(open_provider_request(request, "gemini"), response)
        self.assertEqual(urlopen.call_count, 2)
        sleep.assert_called_once_with(1)

    def test_gemini_503_stops_after_bounded_retries(self):
        outage = urllib.error.HTTPError("https://example.test", 503, "busy", {}, None)
        request = urllib.request.Request("https://example.test")
        with patch("mentor_server.urllib.request.urlopen", side_effect=outage) as urlopen:
            with patch("mentor_server.time.sleep") as sleep:
                with self.assertRaises(urllib.error.HTTPError):
                    open_provider_request(request, "gemini")
        self.assertEqual(urlopen.call_count, 3)
        self.assertEqual(sleep.call_count, 2)

    def test_configure_endpoint_validates_and_keeps_key_in_memory_only(self):
        handler = FakeConfigureHandler("test-secret")
        with patch.object(mentor_server, "_runtime_gemini_key", ""):
            with patch("mentor_server.validate_gemini_key") as validate:
                MentorHandler._configure_gemini(handler)
                self.assertEqual(configured_api_key("gemini"), "test-secret")
                validate.assert_called_once_with("test-secret")
                self.assertEqual(handler.result, (200, {"ok": True, "aiConfigured": True, "provider": "gemini"}))
                self.assertNotIn("test-secret", json.dumps(handler.result))

    def test_configure_endpoint_rejects_another_origin_before_validating(self):
        handler = FakeConfigureHandler("test-secret", origin="http://evil.example")
        with patch("mentor_server.validate_gemini_key") as validate:
            MentorHandler._configure_gemini(handler)
        self.assertEqual(handler.result[0], 403)
        validate.assert_not_called()

    def test_runtime_gemini_key_is_used_without_persisting_it(self):
        import mentor_server
        with patch.dict("os.environ", {"GEMINI_API_KEY": "env-key"}):
            with patch.object(mentor_server, "_runtime_gemini_key", "memory-key"):
                self.assertEqual(configured_api_key("gemini"), "memory-key")
            self.assertEqual(configured_api_key("gemini"), "env-key")

    def test_validates_gemini_key_using_model_metadata_endpoint(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *_args): return False
            def read(self): return b'{"name":"models/gemini-3.5-flash-lite"}'
        with patch("mentor_server.urllib.request.urlopen", return_value=Response()) as urlopen:
            validate_gemini_key("test-secret")
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite")
        self.assertEqual(request.get_header("X-goog-api-key"), "test-secret")

    def test_rejects_unsafe_model_path_before_request(self):
        with patch.dict("os.environ", {"GEMINI_MODEL": "../other"}):
            with self.assertRaisesRegex(ValueError, "formato válido"):
                validate_gemini_key("test-secret")

    def test_parses_gemini_text_and_https_grounding_links_with_official_badge(self):
        result = parse_gemini_result({"candidates": [{
            "finishReason": "STOP",
            "content": {"parts": [{"text": "Consulta la entidad antes de decidir."}]},
            "groundingMetadata": {"groundingChunks": [
                {"web": {"uri": "https://minvivienda.gov.co/", "title": "Minvivienda"}},
                {"web": {"uri": "https://example.com/", "title": "Example"}},
            ]},
        }]})
        self.assertEqual(result["links"], [
            {"title": "Minvivienda", "url": "https://minvivienda.gov.co/", "official": True},
            {"title": "Example", "url": "https://example.com/", "official": False},
        ])
        self.assertNotIn("FUENTES Y LÍMITE", result["text"])

    def test_gemini_without_official_source_keeps_normal_answer_concise(self):
        result = parse_gemini_result({"candidates": [{
            "finishReason": "STOP", "content": {"parts": [{"text": "Respuesta."}]},
        }]})
        self.assertEqual(result["text"], "Respuesta.")
        self.assertEqual(result["links"], [])

    def test_search_request_without_citations_suppresses_unverified_model_claims(self):
        result = parse_gemini_result({"candidates": [{
            "finishReason": "STOP", "content": {"parts": [{"text": "Bogotá es la mejor ciudad para invertir."}]},
        }]}, web_search_requested=True)
        self.assertNotIn("Bogotá es la mejor ciudad", result["text"])
        self.assertIn("no mostraré la respuesta", result["text"])
        self.assertEqual(result["links"], [])

    def test_builds_gemini_chat_roles_and_optional_google_search_tool(self):
        body = build_gemini_body([{"role": "user", "content": "Hola"}, {"role": "assistant", "content": "Buen día"}], "¿UVR?")
        self.assertEqual([item["role"] for item in body["contents"]], ["user", "model", "user"])
        self.assertNotIn("tools", body)
        self.assertEqual(body["generationConfig"]["thinkingConfig"]["thinkingLevel"], "LOW")
        searched = build_gemini_body([], "¿Qué cambió este año?", web_search=True)
        self.assertEqual(searched["tools"], [{"google_search": {}}])
        self.assertIn("Usa Google Search", searched["systemInstruction"]["parts"][0]["text"])

    def test_keeps_only_unique_https_colombian_official_citations(self):
        result = parse_provider_result(output_with_citations([
            ("https://minvivienda.gov.co/", "Minvivienda"),
            ("https://minvivienda.gov.co/", "Minvivienda"),
            ("https://example.com/", "Example"),
            ("http://dane.gov.co/", "DANE sin HTTPS"),
            ("https://gov.co.example.com/", "Dominio parecido"),
        ]))
        self.assertEqual(result["links"], [{"title": "Minvivienda", "url": "https://minvivienda.gov.co/"}])
        self.assertNotIn("FUENTES Y LÍMITE", result["text"])

    def test_warns_when_no_official_citation_arrives(self):
        result = parse_provider_result(output_with_citations([("https://example.com/", "Example")]))
        self.assertEqual(result["links"], [])
        self.assertIn("cita verificable de un sitio oficial colombiano", result["text"])

    def test_rejects_provider_responses_without_text(self):
        with self.assertRaises(ValueError):
            parse_provider_result({"output": []})

    def test_rejects_incomplete_provider_responses(self):
        result = output_with_citations([])
        result["status"] = "incomplete"
        with self.assertRaisesRegex(ValueError, "no completó la respuesta"):
            parse_provider_result(result)

    def test_handles_malformed_annotations_without_losing_provider_text(self):
        result = parse_provider_result({
            "output": [{"type": "message", "content": [{
                "type": "output_text",
                "text": "Verifica el documento con la entidad.",
                "annotations": None,
            }]}],
        })
        self.assertIn("Verifica el documento", result["text"])
        self.assertIn("FUENTES Y LÍMITE", result["text"])

    def test_rejects_non_object_provider_result(self):
        with self.assertRaises(ValueError):
            parse_provider_result(["not", "an", "object"])

    def test_rejects_malformed_urls(self):
        self.assertFalse(is_official_colombian_source("https://[broken.gov.co/"))


if __name__ == "__main__":
    unittest.main()
