# Portfolio Website Agent Rules
# Cantikaputri Febrianti — cantikapf.github.io

## Identity
- **Portfolio root:** `D:\PERSONAL PROJECT\cantikapf.github.io`
- **Owner:** Cantikaputri Febrianti
- **LinkedIn:** https://www.linkedin.com/in/cantikaputri-febrianti/
- Whenever the user says "website portofolio" or "portfolio", ALWAYS refer to this folder.

---

## Architecture Overview

The portfolio is a static HTML/JS site. All page **content** is stored in a single data file:

| File | Purpose |
|------|---------|
| `assets/js/data.js` | All detail page content (HTML strings in JS object) |
| `assets/images/` | All thumbnail and detail images |
| `works.html` | 02 : Research — carousel page |
| `experience.html` | 03 : Work Experience — carousel page |
| `certification.html` | 04 : Certification — carousel page |
| `projects.html` | 05 : Projects — carousel page |
| `detail.html` | Single dynamic detail page (reads from `data.js` via URL params) |

**How detail pages work:**
- URL format: `detail.html?type=<section>&id=<itemId>`
- `detail.html` reads `type` and `id` from URL params, looks up `portfolioData[type][id]` in `data.js`, and injects the `content` HTML string.

---

## Section Keys Reference

| Page | `type` param | Item ID pattern | Current count |
|------|-------------|-----------------|--------------|
| Research | `works` | `work`, `work2`, `work3`, ... | 3 items |
| Work Experience | `experience` | `experience1`, `experience2`, ... | 5 real + 1 "coming soon" |
| Certification | `certification` | `certification1`, `certification2`, ... | 1 real + 5 "coming soon" |
| Projects | `projects` | `project1`, `project2`, ... | 6 real items |

---

## Workflow: Adding a New Item

### STEP 1 — Collect Information from User
Ask the user for:
- **Section** (Research / Work Experience / Certification / Projects)
- **Title** (name of paper / company / certificate / project)
- **Thumbnail image** — does the user have one, or should we use a screenshot / existing placeholder?
- **Detail content** — description, dates, links, highlights

### STEP 2 — Prepare the Thumbnail Image

**Rules by section:**
- **Research (`works`):** Use `work01-hover.jpg` as default thumbnail (all research items use this)
- **Work Experience:** Use company logo/photo if available (e.g., `bank-mandiri.jpg`), else use `work001-01.jpg`
- **Certification:** Use `work001-01.jpg` or a scan/screenshot of the certificate
- **Projects:** Use a **real screenshot** of the project. ALWAYS take a Playwright screenshot if a URL is available. NEVER use AI-generated mockup images.

**To take a real screenshot (for Projects):**
```js
// screenshot.js — run with: node screenshot.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('<URL>', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'assets/images/<filename>.png', type: 'jpeg', quality: 92 });
  await browser.close();
})();
```
Then delete `screenshot.js` after use.

Save thumbnails as:
- `assets/images/project<N>.png` — carousel card thumbnail (aspect-ratio: 770/498)
- `assets/images/project<N>_screenshot.png` — full-width screenshot inside the detail page browser-chrome frame

### STEP 3 — Add Card to the HTML Carousel Page

Open the correct HTML file. Each carousel slide holds **3 cards per `<div class="item">`**.

**Card HTML template:**
```html
<div class="col-sm-4">
  <a href="./detail.html?type=<TYPE>&id=<ID>" class="black-image-project-hover">
    <img src="./assets/images/<THUMBNAIL>" alt="<TITLE>" class="img-responsive"
         style="aspect-ratio: 770/498; object-fit: cover; width: 100%;">
  </a>
  <div class="card-container card-container-lg">
    <h4><NEW_NUM>/<TOTAL></h4>
    <h3><TITLE></h3>
    <p><SUBTITLE (year or date range)></p>
    <a href="./detail.html?type=<TYPE>&id=<ID>" class="btn btn-default">Discover</a>
  </div>
</div>
```

**Placement rules:**
- If the last `<div class="item">` has fewer than 3 cards → append the new card inside it.
- If the last `<div class="item">` already has 3 cards → create a new `<div class="item">` slide.
- After adding, update ALL existing `<h4>NNN/TOTAL</h4>` counters to reflect the new total.
- Replace any matching "Coming soon" placeholder slot with the real entry instead of appending after it.

### STEP 4 — Add Detail Content to `data.js`

Add a new key inside `portfolioData["<type>"]` in `assets/js/data.js`.

**Template — Projects (with browser chrome frame):**
```js
"project<N>": {
  "title": "05 : <SHORT TITLE>",
  "content": "<img src=\"./assets/images/project<N>.png\" class=\"img-responsive\" alt=\"\" style=\"aspect-ratio: 770/498; object-fit: cover; width: 100%;\">\n<div class=\"card-container\"><div class=\"text-center\"><h1 class=\"h2\"><NUM> : <FULL TITLE></h1>\n<br><br>\n<p><b>Category:</b> <CATEGORY><br><b>Year:</b> <YEAR><br><b>Link:</b> <a href=\"<URL>\" target=\"_blank\">Visit Website</a> | <a href=\"<GITHUB>\" target=\"_blank\">GitHub Repository</a><br></p>\n<br><b><ONE-LINE DESCRIPTION></b>\n<br><br>\n<div class=\"col-xs-12\">\n<div style=\"background: #e0e0e0; border-radius: 8px 8px 0 0; padding: 10px; display: flex; align-items: center; border: 1px solid #ccc; border-bottom: none;\">\n<span style=\"width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; margin-right: 8px;\"></span>\n<span style=\"width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; margin-right: 8px;\"></span>\n<span style=\"width: 12px; height: 12px; border-radius: 50%; background: #27c93f; margin-right: 15px;\"></span>\n<div style=\"background: #fff; flex-grow: 1; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #666; font-family: monospace;\"><URL></div>\n</div>\n<div style=\"border: 1px solid #ccc; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);\">\n<img src=\"./assets/images/project<N>_screenshot.png\" class=\"img-responsive\" alt=\"<TITLE>\" style=\"width: 100%; display: block;\">\n</div></div>\n<br>\n<p><DESCRIPTION></p><br>\n</div>\n<div class=\"\"><h3 class=\"template-title-example\">Project Highlights</h3>\n<ol><li><HIGHLIGHT 1></li><li><HIGHLIGHT 2></li><li><HIGHLIGHT 3></li></ol></div>"
}
```

**Template — Work Experience:**
```js
"experience<N>": {
  "title": "<NUM> : <COMPANY NAME>",
  "content": "<img src=\"./assets/images/work001-01.jpg\" class=\"img-responsive\" alt=\"\">\n<div class=\"card-container\"><div class=\"text-center\"><h1 class=\"h2\"><NUM> : <COMPANY NAME></h1>\n<br><br>\n<p><b>Position:</b> <ROLE><br><b>Duration:</b> <START> - <END><br><b>Location:</b> <CITY>, Indonesia</p>\n<br>\n<b><COMPANY DESCRIPTION></b>\n<br><br>\n<div class=\"col-xs-12\"><img src=\"./assets/images/<COMPANY_IMG>\" class=\"img-responsive\" alt=\"\" width=\"100%\" height=\"100%\"><p>Source: <a href=\"<SOURCE_URL>\"><SOURCE NAME></a></p></div>\n<br><p><JOB DESCRIPTION></p><br>\n</div>\n<div class=\"\"><h3 class=\"template-title-example\">Work Portfolio</h3>\n<ol><li><ACHIEVEMENT 1></li><li><ACHIEVEMENT 2></li></ol></div>"
}
```

**Template — Research (works):**
```js
"work<N>": {
  "title": "<NUM> : <PAPER TITLE>",
  "content": "<img src=\"./assets/images/work001-01.jpg\" class=\"img-responsive\" alt=\"\">\n<div class=\"card-container\"><div class=\"text-center\"><h1 class=\"h2\"><NUM> : <PAPER TITLE></h1></div>\n<p><ABSTRACT / INTRO></p>\n<blockquote><p><QUOTE></p><small class=\"pull-right\"><SOURCE></small></blockquote>\n<h2 class=\"template-title-example\">Check out my paper for more information:</h2>\n<p><a href=\"<PAPER_URL>\" class=\"btn btn-primary\" target=\"_blank\" rel=\"noopener noreferrer\">Read Paper</a></p>"
}
```

**Template — Certification:**
```js
"certification<N>": {
  "title": "<NUM> : <CERT NAME>",
  "content": "<img src=\"./assets/images/work001-01.jpg\" class=\"img-responsive\" alt=\"\">\n<div class=\"card-container\"><div class=\"text-center\"><h1 class=\"h2\"><NUM> : <CERT NAME></h1>\n<br><br><br><br>\n<iframe src=\"https://drive.google.com/file/d/<FILE_ID>/preview\" width=\"850\" height=\"950\" allow=\"autoplay\"></iframe>\n</div></div>"
}
```

### STEP 5 — Commit and Push to GitHub

Always push changes immediately after editing:
```bash
git add .
git commit -m "feat: Add <title> to <section>"
git push
```

Commit message conventions:
- `feat: Add <title> to <section>` — for new items
- `fix: Update <item> in <section>` — for corrections
- `chore: Update counter totals in <html file>` — counter-only changes

---

## Panduan Edit Menu dan Halaman (Menu & Page Edit Guide)

### 1. Cara Mengedit Menu Navigasi (Navbar)
Menu navigasi didefinisikan menggunakan Bootstrap navbar pada bagian `<header>` di setiap file HTML utama. Karena website ini adalah static HTML, **perubahan menu harus dilakukan secara manual di semua file HTML berikut**:
- [index.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/index.html)
- [works.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/works.html)
- [experience.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/experience.html)
- [certification.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/certification.html)
- [projects.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/projects.html)
- [about.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/about.html)
- [contact.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/contact.html)
- [detail.html](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/detail.html)

#### Struktur Kode Navbar:
```html
<ul class="nav navbar-nav ">
  <li><a href="./index.html" title="">01 : Home</a></li>
  <li><a href="./works.html" title="">02 : Research</a></li>
  <li><a href="./experience.html" title="">03 : Work Experience</a></li>
  <li><a href="./certification.html" title="">04 : Certification</a></li>
  <li><a href="./projects.html" title="">05 : Projects</a></li>
  <li><a href="./about.html" title="">06 : About me</a></li>
  <li><a href="./contact.html" title="">07 : Contact</a></li>
</ul>
```
*Catatan: Pastikan nomor indeks menu (`01 : Home`, `02 : Research`, dst.) dan tautan (`href`) konsisten di seluruh halaman.*

---

### 2. Cara Mengedit Halaman (Pages)

Ada 2 jenis halaman di website ini:

#### A. Halaman Statis (`index.html`, `about.html`, `contact.html`)
Untuk mengedit konten pada halaman-halaman ini, edit langsung file HTML-nya:
- **Home (`index.html`):** Untuk mengubah teks perkenalan dinamis (typing effect), edit elemen `<span id="typed-strings">`:
  ```html
  <span id="typed-strings">
    <span>I am Cantika</span>
    <span>Majoring in International Relations</span>
    <span>Interested in IR affairs and big data</span>
  </span>
  ```
- **About (`about.html`):** Edit teks biografi, keahlian, atau pendidikan langsung pada struktur grid HTML-nya.
- **Contact (`contact.html`):** Edit alamat email, link media sosial, atau form kontak di dalam HTML.

#### B. Halaman Karusel / Seksi (`works.html`, `experience.html`, `certification.html`, `projects.html`)
Halaman ini menggunakan slider karusel Bootstrap (3 kartu per slide) yang berfungsi sebagai galeri portfolio. 
- Jika ingin menambah/menghapus/mengubah kartu preview di halaman ini, edit struktur HTML kartu di file yang bersangkutan (lihat **Workflow: Adding a New Item - STEP 3**).
- Kartu ini mengarahkan ke halaman detail dengan format link: `./detail.html?type=<TYPE>&id=<ID>`.

#### C. Halaman Detail Dinamis (`detail.html` & `assets/js/data.js`)
Konten halaman detail tidak dibuat terpisah satu per satu, melainkan di-render secara dinamis oleh `detail.html` berdasarkan parameter `type` dan `id` di URL.
- Konten sesungguhnya disimpan sebagai string HTML di dalam variabel `portfolioData` di file [data.js](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/assets/js/data.js).
- **Cara Mengedit Detail Halaman:**
  1. Buka [assets/js/data.js](file:///D:/PERSONAL%20PROJECT/cantikapf.github.io/assets/js/data.js).
  2. Cari kategori (`certification`, `experience`, `works`, atau `projects`).
  3. Temukan ID item yang ingin diedit (misal: `project5`).
  4. Edit string HTML pada properti `content`.
  5. Edit properti `title` jika ingin mengubah judul tab browser ketika halaman tersebut dibuka.

---

## Rules (Must Follow Always)

1. **NEVER use AI-generated images as project thumbnails.** Always use a real screenshot via Playwright.
2. **Always update `<h4>NNN/TOTAL</h4>` counters** on ALL cards in a section after adding a new item.
3. **Replace "Coming soon" placeholders** with real entries — do not append after them.
4. **Image aspect ratio** for all thumbnails: `style="aspect-ratio: 770/498; object-fit: cover; width: 100%;"` — mandatory on all card images.
5. **Always git push** after every change. No local-only edits.
6. **Portfolio folder** is always `D:\PERSONAL PROJECT\cantikapf.github.io` — never elsewhere.
