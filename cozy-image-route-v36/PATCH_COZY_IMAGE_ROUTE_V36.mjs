import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const appFile = path.join(SRC, 'app.js');
const serverFile = path.join(SRC, 'server.js');
const cozyFile = path.join(SRC, 'cozyFlowAutomation.js');
const helperFile = path.join(PUBLIC, 'cozyReferenceTripleExternal.js');

function need(file) {
  if (!fs.existsSync(file)) throw new Error('Khong thay file: ' + file);
}
function backup(file) {
  if (!fs.existsSync(file)) return;
  const b = file + '.before_cozy_image_v36';
  if (!fs.existsSync(b)) fs.copyFileSync(file, b);
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, text) { fs.writeFileSync(file, text, 'utf8'); }

need(appFile);
need(serverFile);
need(cozyFile);
backup(appFile);
backup(serverFile);
backup(cozyFile);
if (fs.existsSync(helperFile)) backup(helperFile);

console.log('============================================================');
console.log('VDT COZY IMAGE ROUTE V36');
console.log('- COZY IMAGE -> cozyFlowAutomation.js');
console.log('- KHONG SUA flowAutomation.js');
console.log('- VIDEO V35 GIU NGUYEN');
console.log('============================================================');

// ------------------------------------------------------------
// 1) Tao export co ten co dinh trong cozyFlowAutomation.js.
//    Khong copy flowAutomation.js, khong sua flowAutomation.js.
// ------------------------------------------------------------
let cozy = read(cozyFile);
cozy = cozy.replace(/\n?\/\/ VDT_COZY_IMAGE_ROUTE_V36_WRAPPER_BEGIN[\s\S]*?\/\/ VDT_COZY_IMAGE_ROUTE_V36_WRAPPER_END\s*\n?/g, '\n');

let invokeLine = '';
if (/(?:export\s+)?async\s+function\s+autoFillFlow\s*\(/.test(cozy)) {
  invokeLine = "return await autoFillFlow(prompt, 'image', safe);";
} else if (/(?:export\s+)?async\s+function\s+createReferenceImageOnly\s*\(/.test(cozy)) {
  invokeLine = 'return await createReferenceImageOnly(safe);';
} else if (/(?:export\s+)?async\s+function\s+createCozyReferenceImageOnly\s*\(/.test(cozy)) {
  invokeLine = 'return await createCozyReferenceImageOnly(safe);';
} else if (/(?:export\s+)?async\s+function\s+createCozyReferenceImages\s*\(/.test(cozy)) {
  invokeLine = 'return await createCozyReferenceImages(safe);';
} else {
  throw new Error('cozyFlowAutomation.js: khong tim thay ham tao anh de tao wrapper V36. KHONG sua file.');
}

cozy += `\n\n// VDT_COZY_IMAGE_ROUTE_V36_WRAPPER_BEGIN\nexport async function createCozyReferenceImageV36(config = {}) {\n  const prompt = String(config?.prompt || '').trim();\n  if (!prompt) return { ok: false, error: 'COZY V36: thieu prompt anh tham chieu.' };\n  const safe = {\n    ...config,\n    prompt,\n    mode: 'image',\n    task: 'reference-image',\n    automationKind: 'cozy-reference-image-only',\n    referenceOnly: true,\n    imageOnly: true,\n    createVideo: false,\n    videoPrompts: [],\n    aspectRatio: config?.aspectRatio || '16:9',\n    imageAspectRatio: config?.imageAspectRatio || config?.aspectRatio || '16:9',\n    closeBrowserAfterDone: config?.closeBrowserAfterDone !== false,\n    vdtCozyImageRouteV36: true\n  };\n  console.log('[cozy-ref-v36] START route rieng -> cozyFlowAutomation.js | source=' + String(config?.promptSource || ''));\n  ${invokeLine}\n}\n// VDT_COZY_IMAGE_ROUTE_V36_WRAPPER_END\n`;
write(cozyFile, cozy);
console.log('[OK] cozyFlowAutomation.js: them export createCozyReferenceImageV36.');

// ------------------------------------------------------------
// 2) Server import + route rieng cho Cozy.
// ------------------------------------------------------------
let server = read(serverFile);
const importLine = "import { createCozyReferenceImageV36 } from './cozyFlowAutomation.js';";
if (!server.includes(importLine)) {
  const flowImportRe = /^import .*from ['"]\.\/flowAutomation\.js['"];?\s*$/m;
  const m = server.match(flowImportRe);
  if (!m) throw new Error('server.js: khong tim thay import flowAutomation.js de chen import Cozy.');
  server = server.replace(m[0], m[0] + '\n' + importLine);
}

const routeMarker = "app.post('/api/cozy/create-reference-image-v36'";
if (!server.includes(routeMarker)) {
  const anchor = "app.post('/api/create-reference-image', express.json({ limit: '25mb' }), async (req, res) => {";
  const pos = server.indexOf(anchor);
  if (pos < 0) throw new Error('server.js: khong tim thay route /api/create-reference-image cu.');

  const route = `// VDT_COZY_IMAGE_ROUTE_V36_BEGIN\napp.post('/api/cozy/create-reference-image-v36', express.json({ limit: '25mb' }), async (req, res) => {\n  try {\n    const prompt = String(req.body?.prompt || '').trim();\n    if (!prompt) return res.status(400).json({ ok: false, error: 'COZY V36: thieu prompt anh tham chieu.', routeFix: 'COZY_IMAGE_ROUTE_V36' });\n\n    console.log('\\n[cozy-ref-v36] ========================================');\n    console.log('[cozy-ref-v36] ROUTE RIENG COZY -> cozyFlowAutomation.js');\n    console.log('[cozy-ref-v36] promptSource:', String(req.body?.promptSource || ''));\n\n    const result = await createCozyReferenceImageV36({\n      ...req.body,\n      prompt,\n      mode: 'image',\n      task: 'reference-image',\n      automationKind: 'cozy-reference-image-only',\n      referenceOnly: true,\n      imageOnly: true,\n      createVideo: false,\n      videoPrompts: [],\n      vdtSource: 'cozy',\n      vdtCozyImageRouteV36: true\n    });\n\n    console.log('[cozy-ref-v36] RESULT:', result?.ok ? 'OK' : ('ERROR ' + String(result?.error || 'unknown')));\n    console.log('[cozy-ref-v36] ========================================\\n');\n\n    return res.json({\n      ...result,\n      ok: !!result?.ok,\n      routeFix: 'COZY_IMAGE_ROUTE_V36',\n      automationModule: 'cozyFlowAutomation.js'\n    });\n  } catch (e) {\n    console.error('[cozy-ref-v36] EXCEPTION:', e.message);\n    return res.status(500).json({\n      ok: false,\n      error: e.message,\n      routeFix: 'COZY_IMAGE_ROUTE_V36',\n      automationModule: 'cozyFlowAutomation.js'\n    });\n  }\n});\n// VDT_COZY_IMAGE_ROUTE_V36_END\n\n`;
  server = server.slice(0, pos) + route + server.slice(pos);
}
write(serverFile, server);
console.log('[OK] server.js: them /api/cozy/create-reference-image-v36.');

// ------------------------------------------------------------
// 3) App: chi Cozy moi dung endpoint V36.
// ------------------------------------------------------------
let app = read(appFile);
const fnStart = app.indexOf('async function runReferenceImageAutomationFromMasterCast');
if (fnStart < 0) throw new Error('app.js: khong tim thay runReferenceImageAutomationFromMasterCast.');
const oldFetch = "const r = await fetch('/api/create-reference-image', {";
const fetchPos = app.indexOf(oldFetch, fnStart);
if (fetchPos < 0 || fetchPos - fnStart > 9000) {
  if (!app.includes("'/api/cozy/create-reference-image-v36'")) {
    throw new Error('app.js: khong tim thay fetch /api/create-reference-image trong ham MASTER CAST.');
  }
} else {
  const replacement = [
    "const v36Source = String((typeof getActiveSourceFromVisibleUI === 'function' ? getActiveSourceFromVisibleUI() : (sourceTypeInput?.value || document.querySelector('#sourceType')?.value || '')) || '').toLowerCase();",
    "    const v36ReferenceEndpoint = v36Source === 'cozy' ? '/api/cozy/create-reference-image-v36' : '/api/create-reference-image';",
    "    const r = await fetch(v36ReferenceEndpoint, {"
  ].join('\n    ');
  app = app.slice(0, fetchPos) + replacement + app.slice(fetchPos + oldFetch.length);
}
write(appFile, app);
console.log('[OK] app.js: Cozy -> /api/cozy/create-reference-image-v36; module khac giu route cu.');

// ------------------------------------------------------------
// 4) Helper 3 REF: day la helper chi danh cho Cozy, nen route anh phai la V36.
// ------------------------------------------------------------
if (fs.existsSync(helperFile)) {
  let helper = read(helperFile);
  const before = helper;
  helper = helper.replaceAll("'/api/create-reference-image'", "'/api/cozy/create-reference-image-v36'");
  helper = helper.replaceAll('"/api/create-reference-image"', '"/api/cozy/create-reference-image-v36"');
  // Mot so ban cu helper goi /api/auto-flow de tao REF. Trong file Cozy rieng, doi sang route V36.
  helper = helper.replaceAll("'/api/auto-flow'", "'/api/cozy/create-reference-image-v36'");
  helper = helper.replaceAll('"/api/auto-flow"', '"/api/cozy/create-reference-image-v36"');
  if (!helper.includes('VDT_COZY_IMAGE_ROUTE_V36_HELPER')) {
    helper = '// VDT_COZY_IMAGE_ROUTE_V36_HELPER\n' + helper;
  }
  if (helper !== before) {
    write(helperFile, helper);
    console.log('[OK] public\\cozyReferenceTripleExternal.js: 3 REF -> route V36.');
  } else {
    console.log('[INFO] Helper Cozy khong co endpoint cu de thay; giu nguyen noi dung + marker neu can.');
    write(helperFile, helper);
  }
} else {
  console.log('[INFO] Khong thay public\\cozyReferenceTripleExternal.js; bo qua helper.');
}

console.log('');
console.log('============================================================');
console.log('[OK] V36 PATCH XONG');
console.log('- flowAutomation.js      : KHONG SUA');
console.log('- cozyFlowAutomation.js  : AUTO ANH COZY RIENG');
console.log('- cozyVideoAutomation.js : KHONG SUA, GIU VIDEO V35');
console.log('- Cozy image route       : /api/cozy/create-reference-image-v36');
console.log('- Helper 3 REF           : goi route Cozy V36');
console.log('============================================================');
