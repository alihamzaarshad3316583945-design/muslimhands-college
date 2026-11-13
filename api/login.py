import hmac
import os
import time
from http.server import BaseHTTPRequestHandler

from backend_lib import (
    ApiError, SESSION_SECONDS, read_json, run_api, send_json, session_cookie,
)


def login(handler):
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().casefold()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or len(admin_password) < 14:
        raise ApiError(503, "Admin sign-in is not configured. Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 14 characters in Vercel.")
    credentials = read_json(handler)
    email = credentials.get("email", "")
    password = credentials.get("password", "")
    if not isinstance(email, str) or not isinstance(password, str):
        raise ApiError(400, "Enter a valid admin email and password.")
    if not hmac.compare_digest(email.strip().casefold(), admin_email) or not hmac.compare_digest(password, admin_password):
        time.sleep(0.35)
        raise ApiError(401, "Email or password is incorrect.")
    expires = int(time.time()) + SESSION_SECONDS
    send_json(handler, 200, {"ok": True}, {"Set-Cookie": session_cookie(expires)})


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        run_api(self, {"POST"}, login)

    def log_message(self, format, *args):
        pass
