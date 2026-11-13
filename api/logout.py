from http.server import BaseHTTPRequestHandler

from backend_lib import clear_session_cookie, require_admin, run_api, send_json


def logout(handler):
    require_admin(handler)
    send_json(handler, 200, {"ok": True}, {"Set-Cookie": clear_session_cookie()})


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        run_api(self, {"POST"}, logout)

    def log_message(self, format, *args):
        pass
