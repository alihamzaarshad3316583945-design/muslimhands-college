from http.server import BaseHTTPRequestHandler

from backend_lib import ApiError, require_admin, run_api, send_json


def status(handler):
    try:
        require_admin(handler)
    except ApiError as error:
        if error.status == 401:
            send_json(handler, 200, {"authenticated": False})
            return
        raise
    send_json(handler, 200, {"authenticated": True})


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        run_api(self, {"GET"}, status)

    def log_message(self, format, *args):
        pass
