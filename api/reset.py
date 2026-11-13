from http.server import BaseHTTPRequestHandler

from backend_lib import (
    PROGRAMS, SETTINGS, database, require_admin, run_api, save_programs,
    save_settings, send_json,
)


def reset(handler):
    require_admin(handler)
    with database() as connection:
        save_settings(connection, SETTINGS)
        save_programs(connection, PROGRAMS)
    send_json(handler, 200, {"settings": SETTINGS, "programs": PROGRAMS})


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        run_api(self, {"POST"}, reset)

    def log_message(self, format, *args):
        pass
