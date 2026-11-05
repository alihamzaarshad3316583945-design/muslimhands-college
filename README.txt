AISHA CAHN COLLEGE WEBSITE

RUN THE WEBSITE
1. Extract the project ZIP.
2. Open the folder in VS Code.
3. Open index.html in Chrome, Edge, or Safari. The site uses plain HTML, CSS, and JavaScript; no package installation or build step is required.
4. Optional: use VS Code Live Server to preview over HTTP. Opening index.html directly also works.

PUBLISH ON VERCEL
1. Import the GitHub repository in Vercel and set the project root to the repository root.
2. Select Other as the framework preset. Leave the build command and install command empty.
3. Set the output directory to "." (the repository root), then deploy.
4. vercel.json enables clean URLs. The existing .html links continue to work.

PAGES
- Home: index.html
- About: about.html
- Programs: programs.html
- Admissions: admissions.html
- Faculty: faculty.html
- Gallery: gallery.html
- Contact: contact.html
- Portal login: login.html
- Student, Teacher, and Admin dashboard previews: student-dashboard.html, teacher-dashboard.html, admin-dashboard.html

DESIGN AND MOTION
- Responsive black, midnight-blue, champagne-gold, and electric-blue theme.
- First-visit cinematic logo introduction with a skip button. It is remembered in browser storage when available and respects prefers-reduced-motion.
- Lightweight CSS 3D, native scroll reveals, image transitions, hover depth, and a small canvas particle field. No GSAP, Three.js, or other runtime dependency is required.
- Course curriculum previews use native, keyboard-accessible disclosure controls.
- The practical-course list can be searched and filtered; each course links to an enquiry form with that course preselected.
- All supplied and illustrative photos are stored locally under images/.

IMPORTANT LIMITATIONS
- This is a front-end demonstration. There is no Supabase or other backend configuration in this project.
- Portal login only demonstrates navigation; it is not authentication.
- Admission and contact forms provide a demo confirmation but do not save or send data. A secure backend is needed for real submissions.
- Dashboard counts and timetable are sample placeholders, not live records. No verified enrollment/statistics were supplied, so none are presented as actual college metrics.
- Confirm board affiliation, admission requirements, fees, dates, timings, official contacts, and staff information with the college before publishing.
- Campus building and Muslim Hands logo images were supplied for this project. Other course/campus images are illustrative stock photos and should be replaced with approved college photos for official use.
