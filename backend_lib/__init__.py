import hashlib
import hmac
import json
import logging
import os
import re
import time
from contextlib import contextmanager
from http.cookies import SimpleCookie
from urllib.parse import urlsplit

import psycopg
from psycopg.rows import dict_row


LOGGER = logging.getLogger("college-api")
SESSION_COOKIE = "acc_admin"
SESSION_SECONDS = 8 * 60 * 60
MAX_REQUEST_BYTES = 32_000
SETTINGS = {
    "homeKicker": "LEARN · INNOVATE · EXCEL",
    "homeTitle": "Where Learning Becomes a Journey",
    "homeDescription": "At Aisha Cahn College of Computer Science & Design Technology, learning begins with a question, grows through exploration, and becomes meaningful when you build something with what you know.",
    "aboutTitle": "Education with a creative edge",
    "aboutDescription": "Aisha Cahn College of Computer Science & Design Technology brings together academic pathways and practical learning. Students can explore intermediate programs and creative and digital skills courses.",
    "programsPageTitle": "Find the right path for you",
    "programsPageDescription": "Intermediate study programs and practical skills courses.",
    "admissionsPageTitle": "Admissions & Enrolment",
    "admissionsPageDescription": "Tell us what you would like to study and ask about the current admission process.",
    "facultyPageTitle": "Faculty & Instructors",
    "facultyPageDescription": "Course areas and illustrative learning photos. Official staff names and portraits can be added when confirmed.",
    "galleryPageTitle": "College Gallery",
    "galleryPageDescription": "Illustrative learning and creative-work photos. Replace these with approved campus photos when available.",
    "contactPageTitle": "Contact the College",
    "contactPageDescription": "Send a question about programs, admissions or student support.",
    "announcement": "",
    "creatorName": "ALI HAMZA",
    "creatorLocation": "Azad Kashmir",
    "creatorBio": "Designed and built this website with care for the college community.",
}
PROGRAMS = [
    {"name": "FA", "description": "Humanities and arts studies. Elective subjects are selected according to the available college and board combinations.", "details": "A humanities-focused intermediate program. Students choose elective subjects from the combinations offered by the college and permitted by the relevant board.", "category": "HUMANITIES & ARTS", "image": "images/study-notes.jpg"},
    {"name": "FA-IT", "description": "Intermediate arts studies with an information technology focus. Ask the college about available subjects and board-approved combinations.", "details": "An arts-focused intermediate program with an information technology focus. Ask the college about current IT subjects and board-approved combinations.", "category": "INFORMATION TECHNOLOGY", "image": "images/computer-learning.jpg"},
    {"name": "ICS", "description": "Computer science with mathematics and a supporting science or elective subject, depending on the approved combination.", "details": "Intermediate study combining computer science with mathematics and supporting subjects. Confirm available combinations with the college.", "category": "COMPUTER SCIENCE", "image": "images/computer-learning.jpg"},
    {"name": "FSc Pre-Medical", "description": "Biology, Chemistry and Physics for students interested in life sciences and related further studies.", "details": "Science preparation for students interested in biological and health-related fields. Core subjects: Biology, Chemistry and Physics.", "category": "LIFE SCIENCES", "image": "images/classroom.jpg"},
    {"name": "FSc Pre-Engineering", "description": "Mathematics, Chemistry and Physics for students interested in engineering and other quantitative fields.", "details": "Science preparation for students interested in engineering and other mathematics-based fields. Core subjects: Mathematics, Chemistry and Physics.", "category": "ENGINEERING & PHYSICAL SCIENCES", "image": "images/digital-student.jpg"},
]
SETTING_LIMITS = {
    "homeKicker": 70, "homeTitle": 100, "homeDescription": 320,
    "aboutTitle": 100, "aboutDescription": 500,
    "programsPageTitle": 100, "programsPageDescription": 240,
    "admissionsPageTitle": 100, "admissionsPageDescription": 240,
    "facultyPageTitle": 100, "facultyPageDescription": 240,
    "galleryPageTitle": 100, "galleryPageDescription": 240,
    "contactPageTitle": 100, "contactPageDescription": 240,
    "announcement": 180, "creatorName": 60, "creatorLocation": 80,
    "creatorBio": 240,
}


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


@contextmanager
def database():
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        raise ApiError(503, "Database is not configured. Set DATABASE_URL in Vercel.")
    try:
        with psycopg.connect(url, connect_timeout=5, row_factory=dict_row, sslmode="require") as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_xact_lock(528204601)")
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS college_content (
                        content_key TEXT PRIMARY KEY,
                        content_value JSONB NOT NULL
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS college_programs (
                        singleton SMALLINT PRIMARY KEY CHECK (singleton = 1),
                        program_list JSONB NOT NULL
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS college_submissions (
                        id BIGSERIAL PRIMARY KEY,
                        kind TEXT NOT NULL CHECK (kind IN ('admission', 'contact')),
                        submission_data JSONB NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            yield connection
    except ApiError:
        raise
    except psycopg.Error as error:
        LOGGER.exception("Database request failed.")
        raise ApiError(503, "The database is temporarily unavailable. Check DATABASE_URL and database access.") from error


def send_json(handler, status, data, headers=None):
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    if headers:
        for key, value in headers.items():
            handler.send_header(key, value)
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def run_api(handler, allowed, operation):
    if handler.command not in allowed:
        send_json(
            handler, 405, {"error": "Method not allowed."},
            {"Allow": ", ".join(sorted(allowed))},
        )
        return
    try:
        operation(handler)
    except ApiError as error:
        send_json(handler, error.status, {"error": error.message})
    except (BrokenPipeError, ConnectionResetError):
        LOGGER.info("Client closed the connection during an API response.")
    except Exception:
        LOGGER.exception("Unexpected API error.")
        send_json(handler, 500, {"error": "An unexpected server error occurred."})


def read_json(handler):
    raw_length = handler.headers.get("Content-Length", "0")
    try:
        length = int(raw_length)
    except ValueError as error:
        raise ApiError(400, "Invalid request length.") from error
    if length <= 0 or length > MAX_REQUEST_BYTES:
        raise ApiError(413 if length > MAX_REQUEST_BYTES else 400, "Request body is empty or too large.")
    try:
        value = json.loads(handler.rfile.read(length))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ApiError(400, "Request body must be valid JSON.") from error
    if not isinstance(value, dict):
        raise ApiError(400, "Request body must be a JSON object.")
    return value


def require_admin(handler):
    if handler.headers.get("X-Admin-Request") != "1":
        raise ApiError(403, "Admin request verification failed.")
    secret = os.environ.get("SESSION_SECRET", "")
    if len(secret) < 32:
        raise ApiError(503, "Admin sessions are not configured. Set a random SESSION_SECRET of at least 32 characters.")
    origin = handler.headers.get("Origin")
    if origin:
        origin_host = urlsplit(origin).netloc.lower()
        request_host = handler.headers.get("Host", "").lower()
        if not origin_host or origin_host != request_host:
            raise ApiError(403, "Cross-origin admin requests are not allowed.")
    raw_cookie = handler.headers.get("Cookie", "")
    cookie = SimpleCookie()
    try:
        cookie.load(raw_cookie)
        token = cookie[SESSION_COOKIE].value
    except (KeyError, ValueError):
        token = ""
    parts = token.split(".", 1)
    if len(parts) != 2:
        raise ApiError(401, "Please sign in as an administrator.")
    try:
        expires = int(parts[0])
    except ValueError as error:
        raise ApiError(401, "Please sign in as an administrator.") from error
    expected = hmac.new(secret.encode("utf-8"), parts[0].encode("ascii"), hashlib.sha256).hexdigest()
    if expires < int(time.time()) or not hmac.compare_digest(expected, parts[1]):
        raise ApiError(401, "Your admin session has expired. Please sign in again.")


def session_cookie(expires):
    secret = os.environ.get("SESSION_SECRET", "")
    if len(secret) < 32:
        raise ApiError(503, "Admin sessions are not configured. Set a random SESSION_SECRET of at least 32 characters.")
    value = str(expires)
    signature = hmac.new(secret.encode("utf-8"), value.encode("ascii"), hashlib.sha256).hexdigest()
    secure = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV") is not None
    flags = "; Secure" if secure else ""
    return f"{SESSION_COOKIE}={value}.{signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age={SESSION_SECONDS}{flags}"


def clear_session_cookie():
    secure = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV") is not None
    flags = "; Secure" if secure else ""
    return f"{SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0{flags}"


def validate_settings(value):
    if set(value) != set(SETTING_LIMITS):
        raise ApiError(400, "Website content fields do not match the expected settings.")
    clean = {}
    for key, maximum in SETTING_LIMITS.items():
        item = value[key]
        if not isinstance(item, str) or len(item) > maximum:
            raise ApiError(400, f"Invalid or overlong value for {key}.")
        clean[key] = item.strip()
    return clean


def validate_programs(value):
    if not isinstance(value, list) or not 1 <= len(value) <= 50:
        raise ApiError(400, "Provide between 1 and 50 programs.")
    clean = []
    seen = set()
    for item in value:
        if not isinstance(item, dict):
            raise ApiError(400, "Each program must be an object.")
        program = {}
        for key, maximum, required in (
            ("name", 60, True), ("description", 240, True),
            ("details", 1200, False), ("category", 80, False),
            ("image", 160, False),
        ):
            field = item.get(key, "")
            if not isinstance(field, str) or len(field) > maximum:
                raise ApiError(400, f"Invalid or overlong program field: {key}.")
            program[key] = field.strip()
            if required and not program[key]:
                raise ApiError(400, f"Program {key} cannot be empty.")
        name_key = program["name"].casefold()
        if name_key in seen:
            raise ApiError(400, "Program names must be unique.")
        seen.add(name_key)
        if program["image"] and (
            not program["image"].startswith("images/")
            or ".." in program["image"]
            or re.search(r"[^a-zA-Z0-9_./% -]", program["image"])
        ):
            raise ApiError(400, "Program images must use a local path under images/.")
        clean.append(program)
    return clean


def load_settings(connection):
    settings = dict(SETTINGS)
    with connection.cursor() as cursor:
        cursor.execute("SELECT content_key, content_value FROM college_content")
        for row in cursor.fetchall():
            if row["content_key"] in SETTING_LIMITS and isinstance(row["content_value"], str):
                settings[row["content_key"]] = row["content_value"]
    return settings


def load_programs(connection):
    with connection.cursor() as cursor:
        cursor.execute("SELECT program_list FROM college_programs WHERE singleton = 1")
        row = cursor.fetchone()
        return row["program_list"] if row else PROGRAMS


def save_settings(connection, value):
    with connection.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO college_content (content_key, content_value)
            VALUES (%s, %s::jsonb)
            ON CONFLICT (content_key) DO UPDATE SET content_value = EXCLUDED.content_value
            """,
            [(key, json.dumps(item, ensure_ascii=False)) for key, item in value.items()],
        )


def save_programs(connection, value):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO college_programs (singleton, program_list)
            VALUES (1, %s::jsonb)
            ON CONFLICT (singleton) DO UPDATE SET program_list = EXCLUDED.program_list
            """,
            (json.dumps(value, ensure_ascii=False),),
        )


def validate_submission(value):
    kind = value.get("kind")
    if kind not in ("admission", "contact"):
        raise ApiError(400, "Submission type must be admission or contact.")
    fields = {
        "admission": {
            "studentName": 100, "guardianName": 100, "email": 254,
            "phone": 40, "course": 100, "session": 100, "message": 2000,
        },
        "contact": {"name": 100, "email": 254, "subject": 160, "message": 3000},
    }[kind]
    clean = {}
    for key, maximum in fields.items():
        item = value.get(key, "")
        if not isinstance(item, str) or len(item) > maximum:
            raise ApiError(400, f"Invalid or overlong submission field: {key}.")
        clean[key] = item.strip()
    email = clean["email"]
    if not email or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise ApiError(400, "A valid email address is required.")
    if kind == "admission" and (not clean["studentName"] or not clean["phone"] or not clean["course"]):
        raise ApiError(400, "Name, phone and program are required for an admission enquiry.")
    if kind == "contact" and any(not clean[key] for key in ("name", "subject", "message")):
        raise ApiError(400, "Name, subject and message are required.")
    return kind, clean
