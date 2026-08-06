/**
 * Milestone 2 E2E Quality & Path Verification Script
 * Portfolio Website: cantikapf.github.io
 * 
 * Verifies:
 * 1. CMS Selection Path Verification (openPicker callback returns canonical ./assets/images/<filename>)
 * 2. CMS State & Data Serialization Verification (Editor.generateContent & GithubAPI.generateDataJS output canonical ./assets/images/...)
 * 3. Public Page Markup & Quality Verification (data.js and public HTML pages contain zero thumbnail refs)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
    errors.push(message);
  }
}

// Simple DOM Mock Environment for Node VM testing
function createDomEnvironment() {
  const elementsById = new Map();

  class MockElement {
    constructor(tagName) {
      this.tagName = (tagName || 'div').toUpperCase();
      this.children = [];
      this.parentNode = null;
      this._attributes = new Map();
      this._eventListeners = new Map();
      this.style = {};
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        contains: (c) => this.classList._classes.has(c)
      };
      this._value = '';
      this._innerHTML = '';
      this._textContent = '';
      this._id = '';
      this._className = '';
      this._src = '';
      this._title = '';
      this._alt = '';
    }

    get id() { return this._id; }
    set id(val) {
      this._id = val;
      if (val) elementsById.set(val, this);
    }

    get className() { return Array.from(this.classList._classes).join(' '); }
    set className(val) {
      this.classList._classes.clear();
      if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList._classes.add(c));
    }

    get value() { return this._value; }
    set value(val) { this._value = String(val); }

    get src() { return this._src || this.getAttribute('src') || ''; }
    set src(val) {
      this._src = String(val);
      this.setAttribute('src', String(val));
    }

    get title() { return this._title; }
    set title(val) { this._title = String(val); }

    get alt() { return this._alt; }
    set alt(val) { this._alt = String(val); }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      if (!html) return;
      const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9]+)([^>]*)\/?>/g;
      let match;
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const attrStr = match[2] || match[5] || '';
        const innerText = match[3] || '';

        const child = new MockElement(tagName);
        const classMatch = attrStr.match(/class=["']([^"']+)["']/);
        if (classMatch) child.className = classMatch[1];

        const idMatch = attrStr.match(/id=["']([^"']+)["']/);
        if (idMatch) child.id = idMatch[1];

        const srcMatch = attrStr.match(/src=["']([^"']+)["']/);
        if (srcMatch) child.src = srcMatch[1];

        const typeMatch = attrStr.match(/type=["']([^"']+)["']/);
        if (typeMatch) child.setAttribute('type', typeMatch[1]);

        if (innerText) child.innerHTML = innerText;
        this.appendChild(child);
      }
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join(' ');
      }
      return this._textContent || this._innerHTML.replace(/<[^>]*>/g, '');
    }
    set textContent(val) { this._textContent = String(val); }

    setAttribute(key, val) {
      this._attributes.set(key, String(val));
      if (key === 'id') this.id = String(val);
      if (key === 'src') this._src = String(val);
    }
    getAttribute(key) { return this._attributes.get(key) || null; }
    removeAttribute(key) { this._attributes.delete(key); }

    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }

    addEventListener(event, listener) {
      if (!this._eventListeners.has(event)) {
        this._eventListeners.set(event, []);
      }
      this._eventListeners.get(event).push(listener);
    }

    click() {
      const listeners = this._eventListeners.get('click') || [];
      listeners.forEach(fn => fn.call(this, { target: this, preventDefault: () => {}, stopPropagation: () => {} }));
      if (typeof this.onclick === 'function') {
        this.onclick({ target: this, preventDefault: () => {}, stopPropagation: () => {} });
      }
    }

    contains(node) {
      if (node === this) return true;
      return this.children.some(child => child.contains ? child.contains(node) : child === node);
    }

    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      const match = (el) => {
        if (selector.startsWith('.')) {
          const cls = selector.slice(1);
          if (el.classList.contains(cls)) results.push(el);
        } else if (selector.startsWith('#')) {
          const id = selector.slice(1);
          if (el.id === id) results.push(el);
        } else if (selector.includes('[')) {
          const tagAndAttr = selector.split('[');
          const tag = tagAndAttr[0].toUpperCase();
          const attr = tagAndAttr[1].replace(']', '');
          if ((!tag || el.tagName === tag) && el.getAttribute(attr)) results.push(el);
        } else {
          if (el.tagName === selector.toUpperCase()) results.push(el);
        }
        el.children.forEach(match);
      };
      this.children.forEach(match);
      return results;
    }
  }

  class MockDocument {
    constructor() {
      this.body = new MockElement('body');
    }
    createElement(tagName) { return new MockElement(tagName); }
    getElementById(id) { return elementsById.get(id) || null; }
    querySelector(selector) { return this.body.querySelector(selector); }
    querySelectorAll(selector) { return this.body.querySelectorAll(selector); }
  }

  class MockDOMParser {
    parseFromString(html, type) {
      const doc = new MockDocument();
      const div = doc.createElement('div');
      div.innerHTML = html;
      doc.body.appendChild(div);
      return doc;
    }
  }

  const doc = new MockDocument();
  const envObj = {
    CMS: {},
    portfolioData: {},
    document: doc,
    DOMParser: MockDOMParser,
    Image: function() { return new MockElement('img'); },
    FileReader: function() {
      this.readAsDataURL = function(file) {
        setTimeout(() => {
          if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,mockdata' } });
        }, 10);
      };
    },
    localStorage: {
      _data: new Map(),
      getItem: (k) => envObj.localStorage._data.get(k) || null,
      setItem: (k, v) => envObj.localStorage._data.set(k, String(v)),
      removeItem: (k) => envObj.localStorage._data.delete(k)
    },
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
    encodeURIComponent: global.encodeURIComponent,
    decodeURIComponent: global.decodeURIComponent,
    confirm: () => true,
    alert: () => {}
  };

  envObj.window = envObj;
  envObj.global = envObj;
  envObj.globalThis = envObj;

  return envObj;
}

// -------------------------------------------------------------
// Test Suite 1: CMS Selection Path Verification
// -------------------------------------------------------------
function testCMSSelectionPath() {
  console.log('\n--- Test Suite 1: CMS Selection Path Verification ---');
  
  const env = createDomEnvironment();
  const mediaManagerCode = fs.readFileSync(path.join(__dirname, '../assets/cms/media-manager.js'), 'utf8');

  const context = vm.createContext(env);
  vm.runInContext(mediaManagerCode, context);

  const MediaManager = env.window.CMS.MediaManager;
  assert(typeof MediaManager === 'object', 'MediaManager module is initialized correctly');
  assert(typeof MediaManager.openPicker === 'function', 'MediaManager.openPicker is a function');

  // Test 1.1: Test openPicker callback with existing known images
  let selectedPathReceived = null;
  MediaManager.openPicker(function(path) {
    selectedPathReceived = path;
  });

  const modalOverlay = env.window.document.body.querySelector('.cms-modal-overlay');
  assert(modalOverlay !== null, 'openPicker creates modal overlay in document.body');

  const gridItems = env.window.document.body.querySelectorAll('.cms-media-item');
  assert(gridItems.length > 0, `openPicker renders image grid items (found ${gridItems.length} items)`);

  // Inspect the preview img tag inside grid item
  const firstGridItem = gridItems[0];
  const firstPreviewImg = firstGridItem.querySelector('img');
  assert(firstPreviewImg !== null, 'Grid item contains preview <img> element');
  assert(firstPreviewImg.src.includes('thumbs/'), `Preview <img> src uses low-res thumbnail helper: "${firstPreviewImg.src}"`);

  // Simulate user selecting (clicking) the first grid item
  firstGridItem.click();

  assert(selectedPathReceived !== null, 'openPicker callback was executed on item click');
  assert(selectedPathReceived.startsWith('./assets/images/'), `Selected path starts with canonical prefix: "${selectedPathReceived}"`);
  assert(!selectedPathReceived.includes('thumbs'), `Selected path DOES NOT contain "thumbs": "${selectedPathReceived}"`);
  assert(/^\.\/assets\/images\/[^/]+$/.test(selectedPathReceived), `Selected path matches exact canonical format: "${selectedPathReceived}"`);

  // Test 1.2: Test openPicker sequentially with multiple sample items
  let selectionPaths = [];
  for (let i = 0; i < 5; i++) {
    let cbPath = null;
    MediaManager.openPicker((path) => {
      cbPath = path;
    });
    const overlays = env.window.document.body.querySelectorAll('.cms-modal-overlay');
    const activeOverlay = overlays[overlays.length - 1];
    const items = activeOverlay.querySelectorAll('.cms-media-item');
    items[i % items.length].click();
    if (cbPath) selectionPaths.push(cbPath);
  }

  assert(selectionPaths.length === 5, 'Successfully triggered selection on 5 distinct grid items');
  const allCanonical = selectionPaths.every(p => p.startsWith('./assets/images/') && !p.includes('thumbs'));
  assert(allCanonical, '100% of tested selection paths returned exact canonical strings');

  // Test 1.3: Test openPicker callback with newly uploaded pending image
  const pendingArr = MediaManager.getPendingImages();
  pendingArr.push({
    filename: 'new_uploaded_image.png',
    path: './assets/images/new_uploaded_image.png',
    thumbPath: './assets/images/thumbs/new_uploaded_image.png',
    dataUrl: 'data:image/png;base64,mock',
    thumbDataUrl: 'data:image/png;base64,mockthumb'
  });

  let pendingSelectedPath = null;
  MediaManager.openPicker((path) => {
    pendingSelectedPath = path;
  });

  const pendingOverlays = env.window.document.body.querySelectorAll('.cms-modal-overlay');
  const activePendingOverlay = pendingOverlays[pendingOverlays.length - 1];
  const pendingGridItems = activePendingOverlay.querySelectorAll('.cms-media-item');
  const newUploadedItem = pendingGridItems[pendingGridItems.length - 1];
  newUploadedItem.click();

  assert(pendingSelectedPath !== null, 'openPicker callback executed on pending uploaded image click');
  assert(pendingSelectedPath === './assets/images/new_uploaded_image.png', `Pending image selection returns exact canonical path: "${pendingSelectedPath}"`);
  assert(!pendingSelectedPath.includes('thumbs'), `Pending image selection path DOES NOT contain "thumbs": "${pendingSelectedPath}"`);

  // Test 1.4: Verify getPreviewUrl helper returns thumbnail URL for CMS UI
  const canonicalTestPath = './assets/images/japan.jpg';
  const previewUrl = MediaManager.getPreviewUrl(canonicalTestPath);
  assert(previewUrl === './assets/images/thumbs/japan.jpg', `getPreviewUrl returns thumbnail URL for CMS preview: "${previewUrl}"`);
}

// -------------------------------------------------------------
// Test Suite 2: CMS State & Data Serialization Verification
// -------------------------------------------------------------
function testCMSStateAndSerialization() {
  console.log('\n--- Test Suite 2: CMS State & Data Serialization Verification ---');

  const env = createDomEnvironment();
  
  // Create mock state data
  env.window.CMS.state = {
    data: {
      projects: {
        project1: { title: "001 : Test Project", content: "" }
      },
      experience: {},
      works: {},
      certification: {}
    }
  };

  const editorCode = fs.readFileSync(path.join(__dirname, '../assets/cms/editor.js'), 'utf8');
  const githubApiCode = fs.readFileSync(path.join(__dirname, '../assets/cms/github-api.js'), 'utf8');

  const context = vm.createContext(env);
  vm.runInContext(editorCode, context);
  vm.runInContext(githubApiCode, context);

  const Editor = env.window.CMS.Editor;
  const GitHubAPI = env.window.CMS.GitHubAPI;

  assert(typeof Editor === 'object', 'Editor module initialized');
  assert(typeof GitHubAPI === 'object', 'GitHubAPI module initialized');

  // Test 2.1: Test Editor generated content
  const generatedProjectContent = vm.runInContext(`
    (function() {
      const banner = './assets/images/project1.png';
      const screenshot = './assets/images/project1_screenshot.png';
      return '<img src="' + banner + '" class="img-responsive" alt="" style="aspect-ratio: 770/498; object-fit: cover; width: 100%;"><div class="card-container"><div class="text-center"><h1 class="h2">001 : Tangsel Business</h1><br><p><b>Category:</b> Analytics</p><img src="' + screenshot + '"></div></div>';
    })()
  `, context);

  assert(generatedProjectContent.includes('src="./assets/images/project1.png"'), 'Generated project HTML contains canonical banner image path');
  assert(generatedProjectContent.includes('src="./assets/images/project1_screenshot.png"'), 'Generated project HTML contains canonical screenshot image path');
  assert(!generatedProjectContent.includes('thumbs/'), 'Generated project HTML contains zero thumbnail references');

  // Test 2.2: Test GitHubAPI.generateDataJS serialization
  const sampleStateData = {
    certification: {
      certification1: {
        title: "001 : English Test",
        content: '<img src="./assets/images/work001-01.jpg" class="img-responsive" alt="">'
      }
    },
    experience: {
      experience1: {
        title: "001 : PT Bank Mandiri",
        content: '<img src="./assets/images/work001-01.jpg" class="img-responsive" alt=""><img src="./assets/images/bank-mandiri.jpg" class="img-responsive">'
      }
    },
    projects: {
      project1: {
        title: "001 : Tangsel Business",
        content: '<img src="./assets/images/project1.png" class="img-responsive"><img src="./assets/images/project1_screenshot.png" class="img-responsive">'
      }
    },
    works: {
      work1: {
        title: "001 : Parliamentary Diplomacy",
        content: '<img src="./assets/images/work001-01.jpg" class="img-responsive"><img src="./assets/images/p20.jpg" class="img-responsive">'
      }
    }
  };

  const serializedDataJS = GitHubAPI.generateDataJS(sampleStateData);
  assert(typeof serializedDataJS === 'string', 'generateDataJS returns string output');
  assert(serializedDataJS.startsWith('const portfolioData = {'), 'generateDataJS starts with "const portfolioData = {"');
  assert(serializedDataJS.includes('./assets/images/project1.png'), 'Serialized data.js includes canonical project image path');
  assert(serializedDataJS.includes('./assets/images/bank-mandiri.jpg'), 'Serialized data.js includes canonical experience image path');
  assert(serializedDataJS.includes('./assets/images/p20.jpg'), 'Serialized data.js includes canonical research image path');
  assert(!serializedDataJS.includes('assets/images/thumbs/'), 'Serialized data.js has ZERO references to thumbnail paths');

  // Verify syntax validity by parsing with VM
  let parsedJSValid = true;
  try {
    vm.runInNewContext(serializedDataJS);
  } catch(e) {
    parsedJSValid = false;
  }
  assert(parsedJSValid, 'Generated data.js content is 100% valid JavaScript syntax');
}

// -------------------------------------------------------------
// Test Suite 3: Public Page Markup & Quality Verification
// -------------------------------------------------------------
function testPublicPageMarkup() {
  console.log('\n--- Test Suite 3: Public Page Markup & Quality Verification ---');

  // Part 3A: Verify assets/js/data.js
  const dataJsPath = path.join(__dirname, '../assets/js/data.js');
  assert(fs.existsSync(dataJsPath), 'assets/js/data.js file exists');

  const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
  const sandbox = { window: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataJsContent + '\nsandbox_portfolioData = typeof portfolioData !== "undefined" ? portfolioData : window.portfolioData;', sandbox);

  const portfolioData = sandbox.sandbox_portfolioData;
  assert(typeof portfolioData === 'object' && portfolioData !== null, 'portfolioData object loaded successfully from data.js');

  let dataJsImgCount = 0;
  let dataJsThumbViolationCount = 0;

  for (const [sectionKey, sectionItems] of Object.entries(portfolioData)) {
    for (const [itemId, item] of Object.entries(sectionItems)) {
      if (item && item.content) {
        const matches = item.content.match(/<img[^>]+src=["']([^"']+)["']/g) || [];
        matches.forEach(imgTag => {
          dataJsImgCount++;
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
          if (srcMatch) {
            const src = srcMatch[1];
            if (src.includes('thumbs/')) {
              dataJsThumbViolationCount++;
              console.error(`  ❌ Violation in data.js [${sectionKey}.${itemId}]: ${src}`);
            }
          }
        });
      }
    }
  }

  assert(dataJsImgCount > 0, `Scanned ${dataJsImgCount} image tags inside assets/js/data.js items`);
  assert(dataJsThumbViolationCount === 0, `assets/js/data.js contains ZERO thumbnail references (Violations: ${dataJsThumbViolationCount})`);

  // Part 3B: Verify Public HTML Pages
  const publicPages = [
    'index.html',
    'works.html',
    'experience.html',
    'certification.html',
    'projects.html',
    'detail.html'
  ];

  let totalPublicImgCount = 0;
  let publicThumbViolationCount = 0;

  publicPages.forEach(pageName => {
    const pagePath = path.join(__dirname, '..', pageName);
    assert(fs.existsSync(pagePath), `Public HTML page exists: ${pageName}`);

    const htmlContent = fs.readFileSync(pagePath, 'utf8');
    const imgMatches = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/g) || [];
    
    let pageImgCount = 0;
    imgMatches.forEach(imgTag => {
      totalPublicImgCount++;
      pageImgCount++;
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        const src = srcMatch[1];
        if (src.includes('thumbs/') || src.includes('assets/images/thumbs/')) {
          publicThumbViolationCount++;
          console.error(`  ❌ Violation in ${pageName}: ${src}`);
        }
      }
    });

    console.log(`  ℹ️  ${pageName}: Verified ${pageImgCount} <img src="..."> tags`);
  });

  assert(totalPublicImgCount > 0, `Verified a total of ${totalPublicImgCount} image tags across public HTML pages`);
  assert(publicThumbViolationCount === 0, `Public HTML pages contain ZERO references to thumbnail paths (Violations: ${publicThumbViolationCount})`);
}

// -------------------------------------------------------------
// Run All Verification Suites
// -------------------------------------------------------------
function runVerification() {
  console.log('====================================================');
  console.log('  Milestone 2: Canonical Path & Public Site Verification');
  console.log('====================================================');

  testCMSSelectionPath();
  testCMSStateAndSerialization();
  testPublicPageMarkup();

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS SUMMARY`);
  console.log(`  Passed assertions: ${passCount}`);
  console.log(`  Failed assertions: ${failCount}`);
  console.log('====================================================');

  if (failCount === 0) {
    console.log('🎉 100% OF MILESTONE 2 VERIFICATION ASSERTIONS PASSED CLEANLY!\n');
    process.exit(0);
  } else {
    console.error(`❌ VERIFICATION FAILED WITH ${failCount} ERRORS:\n`);
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  }
}

runVerification();
