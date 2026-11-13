AISHA CAHN COLLEGE WEBSITE

PROJECT
- Responsive college website using HTML, CSS and JavaScript.
- Python serverless API functions in api/ for Vercel.
- PostgreSQL stores shared website content, programs, and form enquiries.
- See DEPLOY-PYTHON-VERCEL.txt for GitHub, database, environment variable and Vercel setup.

LOCAL PREVIEW
Open index.html in a browser to preview the static design. The live backend and
administrator sign-in require a deployed HTTPS site and configured environment
variables. Student and teacher dashboards remain demonstrations.

PAGES
- Home: index.html
- About: about.html
- Programs: programs.html
- Admissions: admissions.html
- Faculty: faculty.html
- Gallery: gallery.html
- Contact: contact.html
- Portal login: login.html
- Student and Teacher demonstration pages: student-dashboard.html, teacher-dashboard.html
- Administrator dashboard: admin-dashboard.html (requires the configured admin login on deployment)

DESIGN AND MOTION
- Responsive black-and-gold theme across the homepage, interior pages, portals, and dashboard.
- Full-width campus hero, learning approach card, program overview, and quick-navigation ribbon.
- First-visit cinematic logo introduction with a skip button. It is remembered in browser storage when available and respects prefers-reduced-motion.
- Lightweight CSS 3D, native scroll reveals, image transitions, hover depth, and a small canvas particle field; no GSAP or Three.js dependency.
- Course curriculum previews use native, keyboard-accessible disclosure controls.
- The practical-course list can be searched and filtered; each course links to an enquiry form with that course preselected.
- Supplied and illustrative photos are stored locally under images/.

BACKEND AND SECURITY
- The admin dashboard stores edits centrally in PostgreSQL so they appear for all visitors.
- Admin sign-in uses Vercel environment variables and a signed HttpOnly cookie; all admin APIs verify the session.
- Contact and admission enquiries are saved in the database and can be reviewed/deleted by an authenticated admin. They are not emailed.
- Keep DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET in Vercel only; never commit them.
- Enquiries contain personal information. Restrict database access and remove records when they are no longer needed.

CONTENT NOTES
- Dashboard counts and timetable are sample placeholders, not actual enrollment statistics.
- Confirm board affiliation, admission requirements, fees, dates, timings, official contacts and staff information with the college before publishing.
- Campus building and Muslim Hands logo images were supplied for this project. Other course/campus images are illustrative and should be replaced with approved college photos for official use.
