"""Abre la plataforma para probarla en este computador."""
from http.server import ThreadingHTTPServer
from pathlib import Path
import os
import shutil
import subprocess
import threading
import webbrowser

def main():
    package = Path(__file__).resolve().parent
    print("Preparando la versión web optimizada de Mentor…")
    npm = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm:
        raise RuntimeError("No encontré npm. Instala Node.js para compilar la app web.")
    subprocess.run([npm, "run", "build"], cwd=package, check=True, shell=npm.lower().endswith(".cmd"))
    os.environ["MENTOR_WEB_ROOT"] = str(package / "dist")
    from mentor_server import MentorHandler

    port_file = package / ".mentor-port"
    try:
        preferred = int(port_file.read_text(encoding="ascii").strip())
        if not 1024 <= preferred <= 65515:
            preferred = 18765
    except (OSError, ValueError):
        preferred = 18765

    server = None
    for port in [preferred, *range(preferred + 1, min(preferred + 21, 65536))]:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), MentorHandler)
            break
        except OSError:
            continue
    if server is None:
        raise OSError(f"No encontré un puerto libre entre {preferred} y {preferred + 20}.")

    port = server.server_address[1]
    try:
        port_file.write_text(str(port), encoding="ascii")
    except OSError:
        pass
    url = f"http://127.0.0.1:{port}/"
    print(f"Mentor Inmobiliario está disponible en {url}")
    print("Deja esta ventana abierta mientras usas la página. Ctrl+C detiene el servidor.")
    provider = os.environ.get("MENTOR_AI_PROVIDER", "gemini").lower()
    key_name = "OPENAI_API_KEY" if provider == "openai" else "GEMINI_API_KEY"
    if os.environ.get(key_name):
        print(f"IA opcional configurada en este computador (proveedor: {provider}).")
    else:
        print("Modo local listo. Para usar Gemini, configura GEMINI_API_KEY en este computador; el nivel gratuito tiene cuotas y Google puede usar el contenido para mejorar sus productos.")
    # Empieza a atender solicitudes antes de abrir el navegador. En Windows,
    # abrir la pestaña puede retrasarse y el navegador llegaba antes al puerto.
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    def open_browser():
        try:
            webbrowser.open_new_tab(url)
        except Exception as error:
            print(f"No pude abrir el navegador automáticamente: {error}")

    threading.Thread(target=open_browser, daemon=True).start()
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
