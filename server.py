from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import os
import socket
import qrcode

app = Flask(__name__, static_folder=".", template_folder=".")
app.config["SECRET_KEY"] = "abu-dhabi-secret"
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/remote")
def remote():
    return send_from_directory(".", "remote.html")


@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(".", path)


@socketio.on("command")
def handle_command(cmd):
    print(f"Received command: {cmd}")
    emit("remote-command", cmd, broadcast=True)


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(("10.255.255.255", 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = "127.0.0.1"
    finally:
        s.close()
    return IP


if __name__ == "__main__":
    local_ip = get_local_ip()
    # Render and other hosts provide a PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    remote_url = f"http://{local_ip}:{port}/remote"

    print(f"\n🚀 Presentation server running at http://localhost:{port}")

    if os.environ.get("RENDER"):
        print("🌐 Production environment detected (Render)")
    else:
        print(f"📱 Remote control available at: {remote_url}\n")
        # Generate QR Code in terminal (only for local mode)
        qr = qrcode.QRCode()
        qr.add_data(remote_url)
        qr.print_ascii(invert=True)

    socketio.run(app, host="0.0.0.0", port=port)
