from http.server import BaseHTTPRequestHandler

from backend_lib import (
    database, load_settings, read_json, require_admin, run_api, save_settings,
    send_json, validate_settings,
)


def get_content(handler):
    with database() as connection:
        send_json(handler, 200, {"settings": load_settings(connection)})


def put_content(handler):
    require_admin(handler)
    settings = validate_settings(read_json(handler))
    with database() as connection:
        save_settings(connection, settings)
    send_json(handler, 200, {"settings": settings})


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        run_api(self, {"GET"}, get_content)

    def do_PUT(self):
        run_api(self, {"PUT"}, put_content)

    def log_message(self, format, *args):
        pass
