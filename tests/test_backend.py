import io
import json
import os
import time
import unittest
from unittest.mock import patch

from api.login import login
from backend_lib import (
    ApiError,
    PROGRAMS,
    SETTINGS,
    database,
    require_admin,
    session_cookie,
    validate_programs,
    validate_settings,
    validate_submission,
)


class FakeHeaders(dict):
    def get(self, key, default=None):
        return super().get(key, default)


class FakeHandler:
    command = "GET"
    headers = FakeHeaders()


class FakeRequest(FakeHandler):
    def __init__(self, value):
        self.command = "POST"
        body = json.dumps(value).encode("utf-8")
        self.headers = FakeHeaders({"Content-Length": str(len(body))})
        self.rfile = io.BytesIO(body)
        self.wfile = io.BytesIO()
        self.response_status = None
        self.response_headers = {}

    def send_response(self, status):
        self.response_status = status

    def send_header(self, key, value):
        self.response_headers[key] = value

    def end_headers(self):
        pass


class BackendValidationTests(unittest.TestCase):
    def test_default_content_is_valid(self):
        self.assertEqual(validate_settings(dict(SETTINGS)), SETTINGS)
        self.assertEqual(len(validate_programs(PROGRAMS)), 5)

    def test_database_requires_connection_string(self):
        environment = dict(os.environ)
        environment.pop("DATABASE_URL", None)
        with patch.dict(os.environ, environment, clear=True):
            with self.assertRaises(ApiError) as raised:
                with database():
                    pass
        self.assertEqual(raised.exception.status, 503)

    def test_settings_reject_extra_fields(self):
        settings = dict(SETTINGS, unexpected="value")
        with self.assertRaises(ApiError):
            validate_settings(settings)

    def test_programs_reject_duplicate_names(self):
        programs = [dict(PROGRAMS[0]), dict(PROGRAMS[0])]
        with self.assertRaises(ApiError):
            validate_programs(programs)

    def test_programs_reject_external_image_urls(self):
        program = dict(PROGRAMS[0], image="https://example.com/image.jpg")
        with self.assertRaises(ApiError):
            validate_programs([program])

    def test_admission_submission_validation(self):
        kind, data = validate_submission({
            "kind": "admission",
            "studentName": "Student",
            "guardianName": "",
            "email": "student@example.com",
            "phone": "03000000000",
            "course": "ICS",
            "session": "",
            "message": "",
        })
        self.assertEqual(kind, "admission")
        self.assertEqual(data["course"], "ICS")

    def test_contact_requires_valid_email(self):
        with self.assertRaises(ApiError):
            validate_submission({
                "kind": "contact",
                "name": "Student",
                "email": "not-an-email",
                "subject": "Question",
                "message": "Hello",
            })

    def test_signed_admin_session_is_accepted(self):
        secret = "a" * 48
        handler = FakeHandler()
        handler.headers = FakeHeaders({
            "X-Admin-Request": "1",
            "Host": "college.example",
            "Origin": "https://college.example",
        })
        with patch.dict(os.environ, {"SESSION_SECRET": secret}, clear=False):
            cookie = session_cookie(int(time.time()) + 600)
            handler.headers["Cookie"] = cookie.split(";", 1)[0]
            require_admin(handler)

    def test_admin_session_rejects_cross_origin(self):
        secret = "a" * 48
        handler = FakeHandler()
        handler.headers = FakeHeaders({
            "X-Admin-Request": "1",
            "Host": "college.example",
            "Origin": "https://attacker.example",
        })
        with patch.dict(os.environ, {"SESSION_SECRET": secret}, clear=False):
            handler.headers["Cookie"] = session_cookie(int(time.time()) + 600).split(";", 1)[0]
            with self.assertRaises(ApiError) as raised:
                require_admin(handler)
        self.assertEqual(raised.exception.status, 403)

    def test_admin_login_sets_http_only_session_cookie(self):
        request = FakeRequest({"email": "ADMIN@example.com", "password": "a-very-long-password"})
        with patch.dict(os.environ, {
            "ADMIN_EMAIL": "admin@example.com",
            "ADMIN_PASSWORD": "a-very-long-password",
            "SESSION_SECRET": "b" * 48,
        }, clear=False):
            from backend_lib import run_api
            run_api(request, {"POST"}, login)
        self.assertEqual(request.response_status, 200)
        cookie = request.response_headers["Set-Cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Strict", cookie)

    def test_admin_login_rejects_wrong_password(self):
        request = FakeRequest({"email": "admin@example.com", "password": "wrong-password"})
        with patch.dict(os.environ, {
            "ADMIN_EMAIL": "admin@example.com",
            "ADMIN_PASSWORD": "a-very-long-password",
            "SESSION_SECRET": "b" * 48,
        }, clear=False):
            from backend_lib import run_api
            run_api(request, {"POST"}, login)
        self.assertEqual(request.response_status, 401)


if __name__ == "__main__":
    unittest.main()
