import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(ROOT, 'src');
const flowFile = path.join(srcDir, 'flowAutomation.js');
const cozyVideoFile = path.join(srcDir, 'cozyVideoAutomation.js');
const appFile = path.join(srcDir, 'app.js');
const serverFile = path.join(srcDir, 'server.js');
const addonFile = path.join(HERE, 'COZY_VIDEO_V35_ADDON.inc');
const routeFile = path.join(HERE, 'COZY_VIDEO_V35_ROUTE.inc');
const appRefsFile = path.join(HERE, 'COZY_VIDEO_V35_APP_REFS.inc');

function need(file) {
  if (!fs.existsSync(file)) throw new Error('Khong thay file: ' + file);
}
function backup(file) {
  const b = file + '.before_cozy_video_v35';
  if (fs.existsSync(file) && !fs.existsSync(b)) fs.copyFileSync(file, b);
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, text) { fs.writeFileSync(file, text, 'utf8'); }

[flowFile, appFile, serverFile, addonFile, routeFile, appRefsFile].forEach(need);
[flowFile, appFile, serverFile].forEach(backup);
if (fs.existsSync(cozyVideoFile)) backup(cozyVideoFile);

console.log('============================================================');
console.log('VDT COZY VIDEO AUTO RIENG V35');
console.log('- KHONG tim let refImagePath = findReferenceImagePath()');
console.log('- KHONG sua flowAutomation.js');
console.log('- COPY flow hien tai -> cozyVideoAutomation.js + APPEND auto Cozy rieng');
console.log('============================================================');

// 1) Tao auto Cozy rieng. Tuyet doi khong replace bat ky dong refImagePath nao.
let cozy = read(flowFile);
const requiredNames = [
  'async function generateVideoFromReference(',
  'async function ensureVideoConfigOnce185(',
  'async function findPlusAssetButtonBox(',
  'async function waitForAddToPromptAfterUpload185(',
  'async function findAddToPromptBox(',
  'async function closeVideoSettingsPanelAndFocusPrompt185('
];
for (const name of requiredNames) {
  if (!cozy.includes(name)) throw new Error('cozyVideoAutomation V35 thieu helper: ' + name);
}
const oldStart = cozy.indexOf('// VDT_COZY_VIDEO_AUTO_RIENG_V35_BEGIN');
if (oldStart >= 0) cozy = cozy.slice(0, oldStart).trimEnd() + '\n';
cozy += '\n\n' + read(addonFile).trim() + '\n';
write(cozyVideoFile, cozy);
console.log('[OK] Tao src\\cozyVideoAutomation.js V35.');
console.log('[OK] src\\flowAutomation.js GIU NGUYEN.');

// 2) Server: import module Cozy rieng.
let server = read(serverFile);
const cozyImport = "import { createCozyVideosWithThreeReferences } from './cozyVideoAutomation.js';";
if (/^import .*from ['"]\.\/cozyVideoAutomation\.js['"];?\s*$/m.test(server)) {
  server = server.replace(/^import .*from ['"]\.\/cozyVideoAutomation\.js['"];?\s*$/m, cozyImport);
} else {
  const flowImportRe = /^import .*from ['"]\.\/flowAutomation\.js['"];?\s*$/m;
  const m = server.match(flowImportRe);
  if (!m) throw new Error('server.js: khong tim thay import flowAutomation.js.');
  server = server.replace(m[0], m[0] + '\n' + cozyImport);
}

// Neu route Cozy chua co thi chen route V35. Neu route cu da co, giu lai de tranh patch trung.
if (!server.includes("app.post('/api/cozy/create-videos'")) {
  const anchor = "app.post('/api/create-videos', express.json(), async (req, res) => {";
  const pos = server.indexOf(anchor);
  if (pos < 0) throw new Error('server.js: khong tim thay route /api/create-videos.');
  server = server.slice(0, pos) + read(routeFile).trim() + '\n\n' + server.slice(pos);
}
write(serverFile, server);
console.log('[OK] server.js: import Cozy V35 + route /api/cozy/create-videos.');

// 3) App: dam bao Cozy co 3 path va goi route rieng.
let app = read(appFile);

if (!app.includes('body.referenceImagePaths')) {
  const anchor = "    if (body.browserType === 'nst' && !body.nstAccounts?.length) {";
  const pos = app.indexOf(anchor);
  if (pos < 0) throw new Error('app.js: khong tim thay cho chen 3 REF Cozy.');
  app = app.slice(0, pos) + read(appRefsFile) + app.slice(pos);
}

if (!app.includes('VDT_COZY_VIDEO_AUTO_RIENG_V35_ENDPOINT')) {
  const oldFetch = "      const r = await fetch('/api/create-videos', {";
  const pos = app.indexOf(oldFetch);
  if (pos < 0) {
    // Neu V33/V34 da doi sang route Cozy roi thi khong patch trung.
    if (!app.includes("'/api/cozy/create-videos'")) {
      throw new Error('app.js: khong tim thay fetch create-videos cua canh video.');
    }
  } else {
    const replacement = [
      '      // VDT_COZY_VIDEO_AUTO_RIENG_V35_ENDPOINT',
      "      const v35VideoEndpoint = ((typeof getActiveSourceFromVisibleUI === 'function' ? getActiveSourceFromVisibleUI() : (sourceTypeInput?.value || '')) === 'cozy')",
      "        ? '/api/cozy/create-videos'",
      "        : '/api/create-videos';",
      '      const r = await fetch(v35VideoEndpoint, {'
    ].join('\n');
    app = app.slice(0, pos) + replacement + app.slice(pos + oldFetch.length);

    const oldRead = "      const data = await readJsonOrExplain(r, '/api/create-videos');";
    const readPos = app.indexOf(oldRead, pos);
    if (readPos >= 0) {
      app = app.slice(0, readPos) + '      const data = await readJsonOrExplain(r, v35VideoEndpoint);' + app.slice(readPos + oldRead.length);
    }
  }
}
write(appFile, app);
console.log('[OK] app.js: Cozy -> /api/cozy/create-videos; module khac giu route cu.');

console.log('');
console.log('============================================================');
console.log('[OK] V35 PATCH XONG');
console.log('- flowAutomation.js      : KHONG SUA');
console.log('- cozyFlowAutomation.js  : KHONG SUA');
console.log('- cozyVideoAutomation.js : AUTO VIDEO COZY RIENG');
console.log('- Upload Cozy            : 1 LAN CUNG LUC 3 REF');
console.log('- Sau 3/3 REF            : MOI DAN PROMPT + GENERATE');
console.log('============================================================');
