from http.server import BaseHTTPRequestHandler

from backend_lib import (
    database, load_programs, read_json, require_admin, run_api, save_programs,
    send_json, validate_programs,
)


def get_programs(handler):
    with database() as connection:
        send_json(handler, 200, {"programs": load_programs(connection)})


def put_programs(handler):
    require_admin(handler)
    programs = validate_programs(read_json(handler).get("programs"))
    with database() as connection:
        save_programs(connection, programs)
    send_json(handler, 200, {"programs": programs})


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        run_api(self, {"GET"}, get_programs)

    def do_PUT(self):
        run_api(self, {"PUT"}, put_programs)

    def log_message(self, format, *args):
        pass
