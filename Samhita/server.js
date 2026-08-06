const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { load: loadCheerio } = require('cheerio');

const app = express();
const PORT = 3456;

const CONTENT_DIR = path.join(__dirname, 'content');
const TEMPLATE_DIR = path.join(__dirname, 'templates');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const TEMPLATE_ASSETS = __dirname;

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/assets', express.static(TEMPLATE_ASSETS));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// --- API: list all pages ---
app.get('/api/pages', (req, res) => {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
  const pages = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8'));
    return { slug: data.slug, title: data.title, parent: data.parent || null };
  });
  res.json(pages);
});

// --- API: get page content ---
app.get('/api/pages/:slug', (req, res) => {
  const filePath = path.join(CONTENT_DIR, `${req.params.slug}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' });
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
});

// --- API: save page content ---
app.put('/api/pages/:slug', (req, res) => {
  const filePath = path.join(CONTENT_DIR, `${req.params.slug}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' });
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// --- API: create new page ---
app.post('/api/pages', (req, res) => {
  const { slug, title, templateFrom } = req.body;
  if (!slug || !title) return res.status(400).json({ error: 'slug and title required' });
  const filePath = path.join(CONTENT_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) return res.status(409).json({ error: 'Page already exists' });

  let pageData;
  if (templateFrom) {
    const srcPath = path.join(CONTENT_DIR, `${templateFrom}.json`);
    if (fs.existsSync(srcPath)) {
      pageData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
      pageData.slug = slug;
      pageData.title = title;
    }
  }
  if (!pageData) {
    pageData = { slug, title, meta: { description: '' }, sections: [] };
  }
  fs.writeFileSync(filePath, JSON.stringify(pageData, null, 2));
  res.json({ success: true, page: pageData });
});

// --- API: delete page ---
app.delete('/api/pages/:slug', (req, res) => {
  const filePath = path.join(CONTENT_DIR, `${req.params.slug}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// --- API: upload image ---
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// --- API: list section types (for adding new sections) ---
app.get('/api/section-types', (req, res) => {
  res.json([
    { type: 'hero', label: 'Hero Banner' },
    { type: 'story', label: 'Story / Overview' },
    { type: 'audience-cards', label: 'Audience Cards' },
    { type: 'ecosystem-accordions', label: 'Ecosystem Accordions' },
    { type: 'initiative-cards', label: 'Initiative Cards' },
    { type: 'cta-banner', label: 'CTA Banner' },
    { type: 'partners-showcase', label: 'Partners Showcase' },
    { type: 'final-cta', label: 'Final CTA' },
    { type: 'footer', label: 'Footer' }
  ]);
});

// --- Admin panel ---
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Render public page ---
app.get('/', (req, res) => res.redirect('/page/home'));

app.get('/page/:slug', (req, res) => {
  const contentPath = path.join(CONTENT_DIR, `${req.params.slug}.json`);
  if (!fs.existsSync(contentPath)) return res.status(404).send('Page not found');

  const templatePath = path.join(TEMPLATE_DIR, 'base.html');
  if (!fs.existsSync(templatePath)) return res.status(500).send('Template not found');

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const template = fs.readFileSync(templatePath, 'utf8');
  const rendered = renderPage(template, content);
  res.send(rendered);
});

function renderPage(template, content) {
  const $ = loadCheerio(template);
  const meta = content.meta || {};

  $('title').text(content.title);

  // Remove template's default meta tags that will be replaced by raw HTML blocks
  const removeSelectors = [
    'meta[name="description"]', 'meta[name="keywords"]', 'meta[name="author"]',
    'meta[name="robots"]', 'meta[name="theme-color"]',
    'meta[property="og:type"]', 'meta[property="og:url"]', 'meta[property="og:title"]',
    'meta[property="og:description"]', 'meta[property="og:image"]',
    'meta[property="og:image:width"]', 'meta[property="og:image:height"]',
    'meta[property="og:site_name"]', 'meta[property="og:locale"]',
    'meta[name="twitter:card"]', 'meta[name="twitter:title"]',
    'meta[name="twitter:description"]', 'meta[name="twitter:image"]'
  ];
  for (const sel of removeSelectors) $(sel).remove();

  // Inject raw HTML blocks from meta categories
  const metaBlocks = ['primary', 'og', 'twitter', 'technical', 'analytics', 'structured_data'];
  for (const block of metaBlocks) {
    if (meta[block]) $('head').append(meta[block]);
  }

  for (const section of content.sections) {
    const sectionEl = $(`[data-cms-section="${section.id}"]`);
    if (!sectionEl.length) continue;

    sectionEl.find('[data-cms-field]').each((_, el) => {
      const field = $(el).attr('data-cms-field');
      const value = resolveField(section.content, field);
      if (value === undefined) return;

      if ($(el).is('img')) {
        $(el).attr('src', resolveImagePath(value));
      } else if ($(el).attr('data-cms-bg')) {
        $(el).css('background-image', `url('${resolveImagePath(value)}')`);
        $(el).attr('data-bg-src', resolveImagePath(value));
      } else if ($(el).attr('data-cms-html') || /<[a-z][\s\S]*>/i.test(value)) {
        $(el).html(value);
      } else {
        $(el).text(value);
      }
    });

    const repeaters = sectionEl.find('[data-cms-repeat]');
    repeaters.each((_, el) => {
      const field = $(el).attr('data-cms-repeat');
      const items = resolveField(section.content, field);
      if (!Array.isArray(items)) return;

      const templateItem = $(el).children().first().clone();
      $(el).empty();

      for (const item of items) {
        const clone = templateItem.clone();
        clone.find('[data-cms-item-field]').each((_, itemEl) => {
          const itemField = $(itemEl).attr('data-cms-item-field');
          const val = itemField === 'self' ? item : resolveField(item, itemField);
          if (val === undefined) return;

          if ($(itemEl).is('img')) {
            $(itemEl).attr('src', resolveImagePath(val));
          } else if ($(itemEl).attr('data-cms-html')) {
            $(itemEl).html(val);
          } else {
            $(itemEl).text(val);
          }
        });
        $(el).append(clone);
      }
    });
  }

  // Reorder sections in DOM to match JSON order
  const mainEl = $('main.main-wrap');
  if (mainEl.length) {
    const sectionEls = [];
    for (const section of content.sections) {
      const el = $(`[data-cms-section="${section.id}"]`);
      if (el.length && el.parent().is('main.main-wrap')) {
        sectionEls.push(el.clone());
        el.remove();
      }
    }
    for (const el of sectionEls) {
      mainEl.append(el);
    }
  }

  return $.html();
}

function resolveField(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function resolveImagePath(src) {
  if (!src) return src;
  if (src.startsWith('/uploads/') || src.startsWith('http')) return src;
  if (src.startsWith('./')) return '/assets/' + src.slice(2);
  return '/assets/' + src;
}

app.listen(PORT, () => {
  console.log(`Samhita CMS running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Public site: http://localhost:${PORT}/page/home`);
});
