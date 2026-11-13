import json
from http.server import BaseHTTPRequestHandler

from backend_lib import (
    ApiError, database, read_json, require_admin, run_api, send_json,
    validate_submission,
)


def submit(handler):
    value = read_json(handler)
    if value.get("website"):
        send_json(handler, 200, {"ok": True})
        return
    kind, clean = validate_submission(value)
    with database() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO college_submissions (kind, submission_data) VALUES (%s, %s::jsonb)",
                (kind, json.dumps(clean, ensure_ascii=False)),
            )
    send_json(handler, 201, {"ok": True, "message": "Your enquiry was received. The college will follow up using the details provided."})


def list_submissions(handler):
    require_admin(handler)
    with database() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, kind, submission_data, created_at
                FROM college_submissions
                ORDER BY created_at DESC
                LIMIT 100
                """
            )
            items = [
                {
                    "id": row["id"],
                    "kind": row["kind"],
                    "data": row["submission_data"],
                    "createdAt": row["created_at"].isoformat(),
                }
                for row in cursor.fetchall()
            ]
    send_json(handler, 200, {"submissions": items})


def delete_submission(handler):
    require_admin(handler)
    value = read_json(handler)
    submission_id = value.get("id")
    if not isinstance(submission_id, int) or submission_id < 1:
        raise ApiError(400, "A valid submission ID is required.")
    with database() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM college_submissions WHERE id = %s", (submission_id,))
            if cursor.rowcount == 0:
                raise ApiError(404, "Submission was not found.")
    send_json(handler, 200, {"ok": True})


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        run_api(self, {"GET"}, list_submissions)

    def do_POST(self):
        run_api(self, {"POST"}, submit)

    def do_DELETE(self):
        run_api(self, {"DELETE"}, delete_submission)

    def log_message(self, format, *args):
        pass
