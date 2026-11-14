# Samhita-CGF website: admin and backend integration guide

**For:** the client's technology team
**Covers:** what is already built, what your team needs to build or connect, and how to host it on your own server.

---

## 1. Summary

The website is a **static site**: plain HTML, CSS and JavaScript, with no build step and no server code. A new **admin frontend** (`docs/admin/index.html`) gives non-technical staff a form-style editor for:

| Admin section | What staff can do | Where the data lives today |
|---|---|---|
| **Pages** | Edit text, links and images on all 33 pages, with a live preview | The browser only (demo mode) |
| **Job openings** | Create, edit, close and delete openings | The browser only (demo mode) |
| **Blogs** | Write, edit and publish blog posts | The browser only (demo mode) |
| **Enquiries** | Read form submissions, set a status, add notes, export CSV | Sample rows only |

**The admin has no backend yet.** Your team needs to:

1. Build or extend a **backend API** with a database, file storage and email, hosted on your server.
2. **Point the admin at that API.** All storage goes through one small object in the admin file (section 6).
3. Make **four changes on the public website** (section 7):
   - the Careers page loads jobs from the API
   - the apply forms submit to the API
   - the Catalytic Finance form submits to the API
   - the Blogs section loads posts from the API
4. **Host and secure everything** (sections 8 and 9).

> **Decision already made:** the Careers page loads openings **in the browser** from the jobs API each time a visitor opens it. HR's changes appear instantly, with no rebuild.

---

## 2. What exists today

### 2.1 Website

| Item | Detail |
|---|---|
| Location in repo | `docs/`, the web root. `docs/index.html` is the home page. |
| Languages | HTML5, CSS3 (inline `<style>` per page), vanilla JavaScript (ES5/ES2015, inline `<script>`, no frameworks) |
| Fonts | Google Fonts: Figtree, Newsreader |
| Build step | None. Files are served as they are. |
| Hosting today | GitLab (client). The working copy is also mirrored on GitHub Pages. |
| Assets | `docs/assets/` (images in WebP, video, PDFs, logos) |

### 2.2 Forms on the site today (none store data)

| Form | Page(s) | What happens on submit today |
|---|---|---|
| Job application | `careers-<job>-apply.html` (3 pages) | Builds a pre-written email (Gmail link or `mailto:`) to the address in the form's `data-to` attribute (`careers@samhita.org`). **The applicant must attach the CV manually.** These pages are currently `noindex` and not linked; the job pages use an "Apply through Gmail" button instead. |
| Catalytic Finance enquiry | `catalyticfinance.html` (`#cf-form`) | Validates, then shows a success message. **The data is not sent anywhere and is lost.** |
| Careers search | `careers.html` | Filters the cards in the browser only. Not a submission. |

**Job application fields:** `name`, `email`, `phone`, `city`, `total_experience`, `notice_period`, `current_ctc`, `expected_ctc`, `resume` (file: .pdf, .doc or .docx). The job title is in `data-job`.

**Catalytic Finance fields:** `name`, `role`, `organisation`, `email`, `country` (select), `funder` (radio), `interest` (checkbox, multiple), `budget` (select), `goal` (textarea).

### 2.3 Existing jobs API (old Samhita backend)

The current openings were copied from the old site's public API:

```
GET https://samhita-official-be.samhita.org/api/jobs?page=1&page_size=50
```

Each job has this shape. **Keep this shape** so the admin, the Careers page and your existing HR process all use one model.

```json
{
  "id": "71a568fc-c42d-416a-84e1-5fe81f29fe36",
  "title": "Asst. Manager Communications - (Remote)",
  "description": "Plain text: shown as the card summary and the 'Role Overview' section",
  "locations": "Mumbai/Delhi/Bengaluru",
  "experience": "3-5 years",
  "posted_on": "2026-11-02",
  "organization_overview": "<p>…HTML…</p>",
  "responsibilities": "<ul><li>…</li></ul>",
  "qualifications": "<ul><li>…</li></ul>",
  "additional": [ { "title": "Why Samhita?", "html": "<p>…</p>" } ]
}
```

On the job detail page, the sections appear in this order: Organization Overview (`organization_overview`), Role Overview (`description`), Responsibilities (`responsibilities`), Skills-Qualifications and Experience (`qualifications`), then each item in `additional`.

> The rich-text fields in the old API were pasted from Word and carry MSO markup, inline styles and `<font>`/`<span>` wrappers. Clean them on save: allow only `p, b, strong, i, em, u, ul, ol, li, a, br, h4, h5`.

---

## 3. Target architecture

| Layer | Runs on | Responsibility |
|---|---|---|
| **Public website** | Your web server (Nginx) or GitLab Pages, serving `docs/` | Pages; loads jobs and blogs from the API; posts forms to the API |
| **Admin UI** | The same web server, at `/admin/` | Staff editing (already built) |
| **Backend API** | Your server, behind Nginx at `/api/` | Login, roles, jobs, blogs, page publishing, form submissions, uploads, email |
| **Database** | Your server (PostgreSQL) | All records |
| **File storage** | Your server's disk (or S3-compatible storage) | CVs, uploaded images, page versions |
| **Email** | Your SMTP (e.g. Google Workspace or Microsoft 365) | New-application and new-enquiry alerts |

Serve the site and the API from **the same domain** (`https://www.samhita.org` and `https://www.samhita.org/api/…`). This avoids CORS and lets login use a secure, same-site cookie.

---

## 4. Recommended technology

Your team can use any stack. The admin and the site only need the HTTP API in section 5. If the old backend (`samhita-official-be`) is already running and maintained, **extend it** rather than starting a new service; jobs already live there.

For a new service, either of these fits:

| Concern | Option A: Python (recommended) | Option B: Node.js |
|---|---|---|
| Language/runtime | Python 3.12 | Node.js 20 LTS (or newer LTS) |
| Web framework | FastAPI + Uvicorn | Fastify or Express |
| Database access | SQLAlchemy 2 + Alembic (migrations) | Prisma or Knex |
| Validation | Pydantic | Zod |
| HTML cleaning | `bleach` or `nh3` | `sanitize-html` |
| Auth | Session cookie (`itsdangerous`) or `fastapi-users` | `@fastify/session` or `express-session` |
| Email | `aiosmtplib` / `smtplib` | Nodemailer |

Python is the recommendation because the site's existing helper scripts (jobs import, HTML cleaning) are in Python with BeautifulSoup.

**Common to both options:**

| Concern | Choice |
|---|---|
| Database | PostgreSQL 16 |
| Reverse proxy and TLS | Nginx + Let's Encrypt (Certbot) |
| Process and deployment | Docker Compose (api, db, nginx), or systemd services |
| File storage | Local disk outside the web root (e.g. `/srv/samhita/uploads`), or MinIO/S3 |
| Backups | Nightly `pg_dump` plus uploads folder sync, kept off-server |
| Bot protection on public forms | Cloudflare Turnstile (free) or hCaptcha, plus a honeypot field |
| OS | Any current Linux LTS (Ubuntu 24.04 LTS or Debian 12) |

**Self-hosted Supabase** (Postgres with auth, storage and a REST API, run through Docker) is an alternative to writing the API. It needs more server resources and is more involved to operate, so a small API is simpler for this scope.

---

## 5. API specification

All bodies are JSON unless marked multipart. Admin endpoints need a logged-in session. Public endpoints need none.

### 5.1 Authentication and roles

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/login` | `{ "email", "password" }` (or a magic-link flow) | `204` and sets an `HttpOnly; Secure; SameSite=Strict` session cookie |
| POST | `/api/auth/logout` | | `204` |
| GET | `/api/auth/me` | | `{ "email", "name", "role" }` or `401` |

**Roles:**

| Role | Can do |
|---|---|
| `admin` | Everything |
| `hr` | Job openings, plus job-application enquiries |
| `editor` | Pages and blogs |

The admin UI should hide sections the user's role cannot use. That is a small frontend change: hide sidebar items based on `/api/auth/me`.

### 5.2 Jobs

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/jobs?page=1&page_size=50` | Public | **Live jobs only**, newest `posted_on` first. Same shape as section 2.3. Used by the Careers page. |
| GET | `/api/jobs/{id}` | Public | One live job. Used by the job detail page. Returns `404` if it is not live. |
| GET | `/api/admin/jobs` | hr, admin | All jobs including Draft and Closed, plus `status` and `apply_to` |
| POST | `/api/admin/jobs` | hr, admin | Create. Returns the job with its `id`. |
| PUT | `/api/admin/jobs/{id}` | hr, admin | Full update (the admin autosaves, so expect frequent calls; debounce on the client, see 6.3) |
| DELETE | `/api/admin/jobs/{id}` | hr, admin | Delete. A soft delete is recommended. |

**New fields to add to the job model:**
- `status`: `draft`, `live` or `closed`
- `apply_to`: the email that receives applications (default `careers@samhita.org`)
- `slug`: optional, for readable URLs
- optionally `summary`, if the card text should differ from `description`

**Mapping between the admin's job form and the API:**

| Admin field (`docs/admin/index.html`, job object) | API field |
|---|---|
| `title` | `title` |
| `location` | `locations` |
| `experience` | `experience` |
| `posted` (YYYY-MM-DD) | `posted_on` |
| `status` (`Draft`, `Live`, `Closed`) | `status` (lower-case) |
| `applyTo` | `apply_to` |
| `summary` | `description` (or a new `summary` field; see the note below) |
| `sections[]` where `h = "Organization Overview"` | `organization_overview` |
| `sections[]` where `h = "Role Overview"` | `description` (HTML; store the plain-text version for the card) |
| `sections[]` where `h = "Responsibilities"` | `responsibilities` |
| `sections[]` where `h = "Skills-Qualifications and Experience"` | `qualifications` |
| any other `sections[]` item | `additional[] = { title: h, html }` |

> **Decide one thing:** in the old API, the card summary and "Role Overview" share one field, `description`. The admin form has a separate "Short summary" box. Either add a `summary` column, or remove that box from the admin and use `description` for both.

### 5.3 Blogs

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/blogs?page=1&page_size=12` | Public | Published posts only, newest first: `{ id, slug, title, author, date, summary, cover_url }` |
| GET | `/api/blogs/{slug}` | Public | One published post, including `body_html` |
| GET | `/api/admin/blogs` | editor, admin | All posts, including drafts |
| POST / PUT / DELETE | `/api/admin/blogs[/{id}]` | editor, admin | Same pattern as jobs |

**Blog fields:** `id`, `slug` (generated from the title and unique), `title`, `author`, `date`, `summary`, `cover_url`, `body_html`, `status` (`draft` or `published`), `created_at`, `updated_at`.

Clean `body_html` on save. Allow `p, h2, h3, b, strong, i, em, ul, ol, li, a[href], br, blockquote`.

### 5.4 Form submissions (Enquiries)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/forms/job-application` | Public | **multipart/form-data**: the fields from 2.2, plus `job_id` and `resume` (file). Returns `201`. |
| POST | `/api/forms/catalytic-finance` | Public | JSON with the fields from 2.2. `interest` is an array. Returns `201`. |
| GET | `/api/admin/submissions?form=job-application&status=new` | role-based | List with `{ id, form, name, about, created_at, status, notes, data }` |
| PATCH | `/api/admin/submissions/{id}` | role-based | `{ "status": "new" \| "in_progress" \| "done", "notes": "…" }` |
| GET | `/api/admin/submissions/{id}/resume` | hr, admin | Streams the CV. **Never serve CVs from a public URL.** |

**On each public POST:**
1. Verify the captcha token and check the honeypot.
2. Validate and limit field lengths.
3. Store the record.
4. Send an email alert (for jobs, to that job's `apply_to`).
5. Return `201`.

Rate-limit by IP (e.g. 5 per minute).

The admin's Enquiries screen already uses the `form`, `name`, `about`, `date`, `status`, `notes` and `data` (key–value) shape, so return submissions in that shape or map them in the client.

### 5.5 Pages (publishing edits to the 33 site pages)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admin/pages/{file}/draft` | editor, admin | Unpublished edits for that page, or `{}` |
| PUT | `/api/admin/pages/{file}/draft` | editor, admin | Saves the edits object (autosave) |
| POST | `/api/admin/pages/{file}/publish` | editor, admin | Body: `{ "html": "<!DOCTYPE html>…" }`, the full page from the admin's `exportHtml()` |
| GET | `/api/admin/pages/{file}/versions` | editor, admin | Previous published versions |
| POST | `/api/admin/pages/{file}/rollback/{version}` | admin | Restores a version |

**Server-side rules for publish:**
- `{file}` must be one of the 33 known page names (an allowlist). Reject anything else; this blocks path traversal.
- Before overwriting, save the current file as a version (database row or `/srv/samhita/versions/<file>/<timestamp>.html`).
- Write atomically: write a temporary file, then rename it.
- **Integrity check:** reject the publish if the new HTML's `<script>` blocks differ from the current file's. Editors change text and images, never code.
- Optional: also commit the new file to the Git repository, so Git stays the source of truth (see 8.4).

### 5.6 Uploads (images)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/admin/uploads` | editor, hr, admin | multipart `file`. Accept JPEG, PNG and WebP up to 5 MB. Returns `{ "url": "/uploads/2026/11/abc123.webp" }` |

Converting uploads to WebP and limiting them to about 2000 px wide is recommended, to match the site's existing images. Serve `/uploads/` through Nginx as static files.

---

## 6. Connecting the admin UI to the API

Everything is in one file, `docs/admin/index.html` (about 520 lines, vanilla JavaScript, no build). The places to change:

| What | Location (approximate line) | Change |
|---|---|---|
| Storage | `const db = {…}` (about line 151) | Today it reads and writes `localStorage`. Replace it with API calls (see the table below). |
| Login | New | On load, call `GET /api/auth/me`. If it returns `401`, show a login form or redirect. |
| Demo banner | `<span class="demo">` in the header | Remove it. |
| Page drafts | `change()` → `db.set('edits:'+file, …)` (about line 314) | `PUT /api/admin/pages/{file}/draft`, debounced |
| Publish | `function publishPage(file)` (about line 288) | `POST /api/admin/pages/{file}/publish` with `{ html: exportHtml() }`, then clear the draft. Show the result in `toast()`. |
| Image replace (pages) | `FileReader.readAsDataURL` (about line 339) | Upload to `/api/admin/uploads` and use the returned URL. **Today the image is embedded as base64, which must not be published.** |
| Jobs list and load | `async function ensureJobs()` (about line 396) | Today it reads the job cards from `careers.html`. Replace with `GET /api/admin/jobs` and map the fields (5.2). |
| Job save | `save()` inside `viewJob()` (about line 442) | `PUT /api/admin/jobs/{id}` (debounced). New job: `POST`. Delete: `DELETE`. |
| Blog save | `save()` inside `viewBlog()` (about line 475) | Same pattern on `/api/admin/blogs` |
| Blog cover | `#cvf` change handler (about line 479) | Upload, then store the URL |
| Enquiries | `function enquiries()` (about line 484) | Today it creates sample rows. Replace with `GET /api/admin/submissions`. Status and notes changes call `PATCH`. |

**Mapping from the admin's storage keys to the API:**

| `localStorage` key | Replace with |
|---|---|
| `samhita-admin:edits:<file>` | `GET`/`PUT /api/admin/pages/<file>/draft` |
| `samhita-admin:jobs` | `/api/admin/jobs` |
| `samhita-admin:blogs` | `/api/admin/blogs` |
| `samhita-admin:enquiries` | `/api/admin/submissions` |

### 6.1 How page editing works (read before changing it)

- The admin `fetch`es the live page's HTML, parses it, and turns each text node, link and image inside `<main>` into a form field.
- Draft edits are stored as `{ fieldIndex: { h | t | href | src | alt } }`. **Field indexes depend on the page's current HTML.** If a developer changes a page's structure while a draft is open, those draft edits can land on the wrong field.
  - Mitigation: publish or discard drafts before deploying code changes to a page.
  - Alternatively, store a hash of the source HTML with the draft and discard the draft if the hash changes.
- Publishing sends the **whole page**, so the published result does not depend on field indexes.

### 6.2 Not editable in the admin today (developer changes)

- The shared header, navigation and footer. They are repeated in every page; change them once and apply to all 33 files.
- Text inside SVG diagrams and graphics.
- CSS background images.
- Page structure: adding or removing sections, layouts and animations.

### 6.3 Autosave

The admin saves on every keystroke. When calling the API, debounce to roughly one request per 800 ms per record, and show "Saving…" then "Saved" in the existing `#saved` status element.

---

## 7. Changes needed on the public website

### 7.1 Careers page: load openings in the browser (decided)

**`careers.html`:**
- The job cards are currently static HTML between `<!--OPENINGS-->` and `<!--/OPENINGS-->` (about lines 616–623).
- Replace them with a script that calls `GET /api/jobs` and renders the **same markup**: `<article class="op-card" data-k="…" data-l="…">` with the title link, summary and meta list.
  - The existing search filters on the `data-k` (keywords) and `data-l` (location) attributes, so set both.
  - Keep `<p class="op-empty">` for "no results".
- Add a loading state, and an error state such as "Openings could not be loaded. Please email careers@samhita.org."

**Job detail and apply pages:**
- Replace the per-job static files (`careers-<slug>.html`, `careers-<slug>-apply.html`) with **two template pages**, e.g. `careers-job.html?id=<id>` and `careers-apply.html?id=<id>`. These fetch `GET /api/jobs/{id}` and fill the existing layout. The section rules are in 2.3.
- Keep the old URLs working with Nginx redirects for the three current jobs, or leave those files in place until the jobs close.

**SEO notes:**
- Google renders JavaScript, but indexing of browser-loaded pages is slower and less certain.
- For job search visibility, also output `JobPosting` structured data (JSON-LD) from the template, and include the job URLs in the sitemap (`/api/sitemap-jobs.xml` or a generated file).

### 7.2 Job application form: submit to the API

- In the apply template, replace the Gmail/`mailto` submit handler with `fetch('/api/forms/job-application', { method: 'POST', body: new FormData(form) })`. Add the captcha token and `job_id`.
- Show the existing success area on `201`, and an inline error otherwise.
- Then switch the job page's "Apply through Gmail" button to "Apply Now", linking to the apply page, and remove `noindex` from the apply page.

### 7.3 Catalytic Finance form: submit to the API

In `catalyticfinance.html`, the submit handler (about line 1447) only validates and shows success. After validation, send the form values (including the `interest` checkboxes) to `POST /api/forms/catalytic-finance`. Show `#cf-success` only on `201`.

### 7.4 Blogs (Knowledge Centre)

- `knowledgecentre.html` shows "Blogs, Coming soon" in two places (about lines 644 and 702). Make them links to a new `blogs.html`.
- **`blogs.html`:** a list from `GET /api/blogs`, using the site's existing card styles.
- **`blog.html?slug=<slug>`:** one post from `GET /api/blogs/{slug}`, with the title, author, date, cover and body.

---

## 8. Hosting on your own server

### 8.1 Minimum server

| Item | Size |
|---|---|
| CPU and memory | 2 vCPU, 4 GB RAM |
| Disk | 40 GB SSD |
| OS | Ubuntu 24.04 LTS |
| Open ports | 80 and 443 only. SSH restricted to your IPs. |

This is enough for the site, the API and PostgreSQL at this traffic level. **Self-hosted Supabase needs about 8 GB RAM.**

### 8.2 Docker Compose (outline)

```yaml
services:
  db:
    image: postgres:16
    environment: [POSTGRES_DB=samhita, POSTGRES_USER=samhita, POSTGRES_PASSWORD_FILE=/run/secrets/db_pw]
    volumes: [pgdata:/var/lib/postgresql/data]
  api:
    build: ./api
    env_file: .env            # DATABASE_URL, SESSION_SECRET, SMTP_*, CAPTCHA_SECRET, SITE_DIR, UPLOAD_DIR
    volumes:
      - ./site:/srv/site       # the docs/ folder; the API writes published pages here
      - uploads:/srv/uploads
      - versions:/srv/versions
    depends_on: [db]
  nginx:
    image: nginx:stable
    ports: ["80:80", "443:443"]
    volumes: [./site:/srv/site:ro, uploads:/srv/uploads:ro, ./nginx.conf:/etc/nginx/conf.d/default.conf:ro, /etc/letsencrypt:/etc/letsencrypt:ro]
volumes: { pgdata: {}, uploads: {}, versions: {} }
```

### 8.3 Nginx (outline)

```nginx
server {
  listen 443 ssl http2;
  server_name www.samhita.org;
  root /srv/site;                       # contents of docs/

  location /api/     { proxy_pass http://api:8000; client_max_body_size 6m; }
  location /uploads/ { alias /srv/uploads/; expires 30d; }
  location /admin/   { add_header X-Robots-Tag "noindex, nofollow"; try_files $uri $uri/ /admin/index.html; }
  location /         { try_files $uri $uri.html $uri/ =404; }

  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com https://www.linkedin.com";
}
```

Check the CSP against every page before enforcing it. Every page uses inline scripts, `media.html` embeds LinkedIn posts in iframes, and some pages load YouTube thumbnails from `i.ytimg.com`. Start with `Content-Security-Policy-Report-Only`.

### 8.4 Deployment flow

- **Code changes** (developers): GitLab → CI pipeline → copy `docs/` to `/srv/site` on the server (rsync over SSH, or a Docker image).
- **Content changes** (staff): the admin → API → database (jobs, blogs, submissions), or the API writes HTML into `/srv/site` (page publish).
- **Keep the two from overwriting each other.** A code deploy that copies `docs/` would overwrite pages staff published through the admin. Choose one:
  1. **(Recommended)** On publish, the API also commits the page to the GitLab repo through the GitLab API, so Git always has the latest content. CI deploys as normal.
  2. Before each code deploy, the CI pipeline pulls the published pages from the server back into the repo.

### 8.5 Backups

- Nightly `pg_dump`, plus the uploads and versions folders, kept off-server.
- Keep 14 daily and 8 weekly copies.
- Test a restore once before go-live.

---

## 9. Security and compliance checklist

- [ ] The admin is only usable after login. All `/api/admin/*` endpoints check the session and role on the server, not just in the UI.
- [ ] Session cookie: `HttpOnly`, `Secure`, `SameSite=Strict`. Expires after 12 hours.
- [ ] Optionally, `/admin/` is restricted to office IPs or a VPN.
- [ ] Passwords hashed with Argon2 or bcrypt, or a magic link sent only to emails on an allowlist.
- [ ] Rich text from jobs and blogs is cleaned on the server (allowlists in 2.3 and 5.3).
- [ ] Page publish uses the filename allowlist and the script-block integrity check, and keeps versions.
- [ ] Uploads: file type checked by content, not just extension; size limits; random filenames; CVs stored outside the web root.
- [ ] Public forms have a captcha, a honeypot, rate limiting and field-length limits.
- [ ] **Personal data (DPDP Act 2023):** job applications contain CVs, phone numbers and salary details.
  - Add a consent line linked to the privacy policy (the apply form already has one).
  - Only HR can see applications.
  - Set a retention period (e.g. delete after 12 months).
  - Log who views or exports applications.
- [ ] HTTPS everywhere, plus HSTS.
- [ ] The database is not reachable from the internet.
- [ ] Secrets are in `.env` or Docker secrets, never in the repo. The repo mirror on GitHub is **public**.

---

## 10. Suggested order of work

| # | Task | Done when |
|---|---|---|
| 1 | Server, Docker, PostgreSQL, Nginx, TLS, backups | The site loads over HTTPS from your server |
| 2 | Auth and roles | `/api/auth/me` works and the admin shows a login |
| 3 | Jobs API (extend the old one or build new) and connect the admin's Job openings screen | HR creates a job in the admin and it is in the database |
| 4 | Careers page, job and apply templates loading from the API | A Live job appears on the Careers page within seconds; Closed jobs disappear |
| 5 | Form submissions (job application, Catalytic Finance) and the admin's Enquiries screen | A test application with a CV arrives in Enquiries and triggers an email alert |
| 6 | Uploads and page publish (draft, publish, versions, Git commit) | An editor changes a heading, publishes, and the live page updates; rollback works |
| 7 | Blogs API, admin connection, `blogs.html` and `blog.html`, Knowledge Centre links | A published post appears on the site |
| 8 | Security checklist, CSP, a load test of the forms, a restore test | All items in section 9 are ticked |

---

## 11. Questions for your team

1. Will you **extend the existing `samhita-official-be` backend**, or build a new service? What is its stack?
2. Which **domain** will serve the site and the API? Will GitLab Pages be replaced by your server?
3. Which **email/SMTP** service should send alerts, and to which addresses (HR, partnerships)?
4. **Summary vs Role Overview:** add a `summary` field, or remove the admin's "Short summary" box? (See 5.2.)
5. **Page publishing:** should the API commit published pages to GitLab (option 1 in 8.4)?
6. How many staff need admin access, and in which roles?
7. What retention period for job applications?

---

## 12. Known limitations of the admin UI (as delivered)

- Demo mode: all data is in the browser's `localStorage`. Clearing browser data loses it, and nothing is shared between users.
- Job openings are seeded by reading the cards on `careers.html` and the three job pages. Replace this with the API (section 6).
- The Enquiries screen shows sample rows only.
- Publish shows a message only; it does not change the live site.
- Replaced images are embedded as base64 until uploads are connected.
- There is no edit locking: two people editing the same page or job at once will overwrite each other. Optionally, add an `updated_at` check on save and return `409` on conflict.
- The admin's list of pages is fixed in the `PAGES` array (about line 167). Add any new page there.
