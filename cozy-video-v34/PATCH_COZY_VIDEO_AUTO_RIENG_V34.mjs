import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const FLOW = path.join(ROOT, 'src', 'flowAutomation.js');
const COZY = path.join(ROOT, 'src', 'cozyVideoAutomation.js');
const SERVER = path.join(ROOT, 'src', 'server.js');
const APP = path.join(ROOT, 'src', 'app.js');

function backup(file, suffix) {
  if (!fs.existsSync(file)) throw new Error('Khong thay file: ' + file);
  const out = file + suffix;
  if (!fs.existsSync(out)) fs.copyFileSync(file, out);
}

function replaceAt(text, start, end, value) {
  return text.slice(0, start) + value + text.slice(end);
}

function replaceFirstAfter(text, needle, replacement, fromIndex = 0) {
  const i = text.indexOf(needle, fromIndex);
  if (i < 0) throw new Error('Khong tim thay: ' + needle);
  return replaceAt(text, i, i + needle.length, replacement);
}

backup(FLOW, '.before_cozy_video_v34_source');
backup(SERVER, '.before_cozy_video_v34');
backup(APP, '.before_cozy_video_v34');

// ============================================================
// 1) TAO AUTO VIDEO COZY RIENG TU FLOW HIEN TAI
//    KHONG SUA flowAutomation.js
// ============================================================
fs.copyFileSync(FLOW, COZY);
let cozy = fs.readFileSync(COZY, 'utf8');

const oldExport = 'export async function createVideosFromExistingProject(videoPrompts, videoModel, config) {';
const newExport = 'export async function createCozyVideosFromExistingProject(videoPrompts, videoModel, config) {';
if (!cozy.includes(oldExport)) {
  throw new Error('cozyVideoAutomation: khong tim thay export createVideosFromExistingProject.');
}
cozy = cozy.replace(oldExport, newExport);

// Tim ham video theo TEN HAM, khong tim ca signature nhu V33.
const videoFnNeedle = 'async function generateVideoFromReference(';
const videoFnPos = cozy.indexOf(videoFnNeedle);
if (videoFnPos < 0) {
  throw new Error('cozyVideoAutomation: khong tim thay generateVideoFromReference theo ten ham.');
}

// Doi ham goc thanh Original; wrapper V34 se dung ham goc sau khi gan 3 REF.
cozy = replaceFirstAfter(
  cozy,
  'async function generateVideoFromReference(',
  'async function generateVideoFromReferenceOriginal(',
  videoFnPos
);

const helper = String.raw`

// VDT_COZY_VIDEO_V34_BATCH_3REF_BEGIN
async function cozyComposerReferenceEvidenceV34(page) {
  return await page.evaluate(() => {
    const all = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll?.('*') || []) {
        all.push(el);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);

    const signatures = [];
    for (const el of all) {
      if (!el.matches?.('img,video,canvas')) continue;
      const r = el.getBoundingClientRect?.();
      if (!r || r.width < 26 || r.height < 26 || r.width > 220 || r.height > 170) continue;
      if (r.bottom < window.innerHeight * 0.58 || r.top > window.innerHeight - 35) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) < 0.08) continue;
      const src = el.currentSrc || el.src || '';
      signatures.push([Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), src.slice(-80)].join(':'));
    }
    return { count: new Set(signatures).size, signatures: [...new Set(signatures)] };
  }).catch(() => ({ count: 0, signatures: [] }));
}

async function waitCozyReferenceEvidenceIncreaseV34(page, previous, timeoutMs = 12000) {
  const before = Number(previous?.count || 0);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const now = await cozyComposerReferenceEvidenceV34(page);
    if (Number(now.count || 0) > before) return now;
    await sleep(350);
  }
  return null;
}

async function findCozyUploadMediaBoxV34(page) {
  return await page.evaluate(() => {
    const all = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll?.('*') || []) {
        all.push(el);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    const visible = (el) => {
      const r = el.getBoundingClientRect?.();
      if (!r || r.width < 20 || r.height < 18) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) >= 0.08;
    };
    const candidates = all.filter(el => {
      if (!el.matches?.('button,[role="button"],div,span')) return false;
      if (!visible(el)) return false;
      const label = (String(el.textContent || '') + ' ' + String(el.getAttribute?.('aria-label') || '') + ' ' + String(el.getAttribute?.('title') || '')).toLowerCase();
      return label.includes('upload media') || label.includes('tải nội dung nghe nhìn lên') || label.includes('tải nội dung') || label.includes('tải lên') || label.includes('media uploads');
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.abs((ar.top + ar.height / 2) - innerHeight * 0.78) - Math.abs((br.top + br.height / 2) - innerHeight * 0.78);
    });
    const el = candidates[0];
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: String(el.textContent || el.getAttribute?.('aria-label') || '').trim().slice(0, 120) };
  }).catch(() => null);
}

async function uploadCozyThreeFilesOneTimeV34(page, refPaths, log) {
  log('  COZY V34: UPLOAD 1 LAN CUNG LUC 3 ANH THAM CHIEU.');

  const plusBox = await findPlusAssetButtonBox(page);
  if (!plusBox) throw new Error('COZY V34: khong tim thay dau + assets.');
  await humanMoveAndClickBox(page, plusBox, log, 'COZY dau + assets');
  await humanDelay(600, 1100, log);

  const uploadBox = await findCozyUploadMediaBoxV34(page);
  let chooser = null;
  if (uploadBox) {
    const chooserPromise = page.waitForFileChooser({ timeout: 10000 }).catch(() => null);
    await humanMoveAndClickBox(page, uploadBox, log, uploadBox.text ? 'COZY Upload media (' + uploadBox.text + ')' : 'COZY Upload media');
    chooser = await chooserPromise;
  }

  if (chooser) {
    await chooser.accept(refPaths);
    log('  COZY V34: file chooser da nhan DU 3 file trong MOT LAN.');
  } else {
    let fileInput = null;
    for (let i = 0; i < 30; i++) {
      const inputs = await page.$$('input[type="file"]');
      if (inputs.length) { fileInput = inputs[inputs.length - 1]; break; }
      await sleep(300);
    }
    if (!fileInput) throw new Error('COZY V34: khong tim thay input file de upload 3 anh.');
    await fileInput.uploadFile(...refPaths);
    log('  COZY V34: hidden input da nhan DU 3 file trong MOT LAN.');
  }

  await slowThink('COZY cho Flow xu ly 3 anh upload cung luc', log, 6500, 9500);
}

async function addCozyCurrentReferenceV34(page, log, index, total, previousEvidence) {
  const addBox = await waitForAddToPromptAfterUpload185(page, log, 30000);
  if (!addBox) throw new Error('COZY V34: anh ' + index + '/' + total + ' chua co Add to Prompt.');

  log('  COZY V34: Add to Prompt anh ' + index + '/' + total + '.');
  await humanMoveAndClickBox(page, addBox, log, 'Add to Prompt REF ' + index);
  await humanDelay(1600, 2600, log);

  let evidence = await waitCozyReferenceEvidenceIncreaseV34(page, previousEvidence, 9000);
  if (!evidence) {
    const retryBox = await findAddToPromptBox(page).catch(() => null);
    if (retryBox) {
      log('  COZY V34: popup con mo, bam lai dung Add to Prompt 1 lan.');
      await humanMoveAndClickBox(page, retryBox, log, 'Retry Add to Prompt REF ' + index);
      await humanDelay(1800, 2800, log);
      evidence = await waitCozyReferenceEvidenceIncreaseV34(page, previousEvidence, 7000);
    }
  }

  if (!evidence) throw new Error('COZY V34: da bam Add nhung chua xac minh thumbnail moi cua REF ' + index + ' trong composer.');
  log('  COZY V34: PASS thumbnail REF ' + index + '/' + total + ' trong composer.');
  return evidence;
}

async function attachCozyThreeReferencesBatchV34(page, refPaths, log) {
  if (!Array.isArray(refPaths) || refPaths.length !== 3) {
    throw new Error('COZY V34 bat buoc DU 3 anh tham chieu.');
  }
  for (let i = 0; i < 3; i++) {
    if (!existsSync(refPaths[i])) throw new Error('COZY V34 khong thay REF ' + (i + 1) + ': ' + refPaths[i]);
  }

  log('  COZY V34 REF1=' + refPaths[0]);
  log('  COZY V34 REF2=' + refPaths[1]);
  log('  COZY V34 REF3=' + refPaths[2]);

  let evidence = await cozyComposerReferenceEvidenceV34(page);
  await uploadCozyThreeFilesOneTimeV34(page, refPaths, log);

  // Giong luong AI Wilderness: upload chung 3 file; anh 1 Add ngay.
  evidence = await addCozyCurrentReferenceV34(page, log, 1, 3, evidence);

  // Anh 2 va 3: chi mo lai dau +, KHONG upload lai, KHONG click anh lon.
  for (let i = 2; i <= 3; i++) {
    const plusBox = await findPlusAssetButtonBox(page);
    if (!plusBox) throw new Error('COZY V34: khong tim thay dau + de Add REF ' + i + '/3.');
    await humanMoveAndClickBox(page, plusBox, log, 'COZY dau + REF ' + i);
    await humanDelay(700, 1200, log);
    evidence = await addCozyCurrentReferenceV34(page, log, i, 3, evidence);
  }

  log('  COZY V34: PASS 3/3 REF. BAY GIO MOI DUOC DAN PROMPT VIDEO.');
  return true;
}

async function generateVideoFromReference(page, videoPrompt, videoNum, outputDir, modelName, aspectRatio, videoCount, log, refImagePath = null) {
  if (Array.isArray(refImagePath)) {
    if (refImagePath.length !== 3) throw new Error('COZY V34: generate nhan ' + refImagePath.length + '/3 REF.');
    const targetVideoAspectRatio = normalizeFlowAspectRatio(aspectRatio || '16:9');
    await ensureVideoConfigOnce185(page, log, targetVideoAspectRatio);
    await closeVideoSettingsPanelAndFocusPrompt185(page, log);
    await attachCozyThreeReferencesBatchV34(page, refImagePath, log);
    // Ham goc lo phan prompt -> Generate -> cho render -> download.
    // Truyen null de ham goc KHONG gan them mot REF lan nua.
    return await generateVideoFromReferenceOriginal(page, videoPrompt, videoNum, outputDir, modelName, aspectRatio, videoCount, log, null);
  }
  return await generateVideoFromReferenceOriginal(page, videoPrompt, videoNum, outputDir, modelName, aspectRatio, videoCount, log, refImagePath);
}
// VDT_COZY_VIDEO_V34_BATCH_3REF_END

`;

cozy = cozy.slice(0, videoFnPos) + helper + cozy.slice(videoFnPos);

// Trong auto Cozy rieng: bat buoc lay 3 path tu config, khong dung ref don.
const refAssignNeedle = 'let refImagePath = findReferenceImagePath();';
const refAssignPos = cozy.indexOf(refAssignNeedle);
if (refAssignPos < 0) {
  throw new Error('cozyVideoAutomation: khong tim thay let refImagePath = findReferenceImagePath().');
}
const cozyRefOverride = `${refAssignNeedle}\n  const cozyV34Refs = Array.isArray(config?.referenceImagePaths)\n    ? config.referenceImagePaths.map(p => String(p || '').trim()).filter(Boolean).slice(0, 3)\n    : [];\n  if (cozyV34Refs.length !== 3) {\n    const msg = 'COZY V34 can DU 3 anh tham chieu, hien co ' + cozyV34Refs.length + '/3.';\n    log('ERROR: ' + msg);\n    return { ok: false, error: msg, logs };\n  }\n  refImagePath = cozyV34Refs;\n  log('COZY V34: da khoa 3 REF cho auto video rieng.');`;
cozy = cozy.replace(refAssignNeedle, cozyRefOverride);

fs.writeFileSync(COZY, cozy, 'utf8');
console.log('[OK] Tao src\\cozyVideoAutomation.js tu flowAutomation hien tai.');
console.log('[OK] flowAutomation.js KHONG BI SUA.');
console.log('[OK] Cozy V34 upload 3 anh CUNG 1 LAN.');

// ============================================================
// 2) SERVER: import auto Cozy rieng + route rieng
// ============================================================
let server = fs.readFileSync(SERVER, 'utf8');

const importNeedle = "import { autoFillFlow, createReferenceImageOnly, createVideosFromExistingProject, checkFlowProjectReady } from './flowAutomation.js';";
if (!server.includes("from './cozyVideoAutomation.js'")) {
  if (!server.includes(importNeedle)) throw new Error('server.js: khong tim thay import flowAutomation de chen import Cozy.');
  server = server.replace(importNeedle, importNeedle + "\nimport { createCozyVideosFromExistingProject } from './cozyVideoAutomation.js';");
}

if (!server.includes("app.post('/api/cozy/create-videos'")) {
  const routeAnchor = "app.post('/api/create-videos', express.json(), async (req, res) => {";
  const routePos = server.indexOf(routeAnchor);
  if (routePos < 0) throw new Error('server.js: khong tim thay /api/create-videos de chen route Cozy truoc no.');

  const route = String.raw`
// VDT_COZY_VIDEO_V34_ROUTE_BEGIN
app.post('/api/cozy/create-videos', express.json(), async (req, res) => {
  const {
    videoPrompts = [], outputDir = '', projectDir = '', referenceImagePaths = [],
    browserType = 'chrome', nstApiUrl = 'http://localhost:8848/api/v2',
    videoModel = 'Veo 3.1 - Lite', aspectRatio = '16:9', videoCount = '1x',
    videoPlatform = 'veo3', videoStartIndex = 0
  } = req.body || {};

  if (!Array.isArray(videoPrompts) || !videoPrompts.length) return res.status(400).json({ ok: false, error: 'Cozy: thieu videoPrompts' });
  if (!outputDir) return res.status(400).json({ ok: false, error: 'Cozy: chua chon thu muc luu video' });
  const refs = Array.isArray(referenceImagePaths) ? referenceImagePaths.map(x => String(x || '').trim()).filter(Boolean).slice(0, 3) : [];
  if (refs.length !== 3) return res.status(400).json({ ok: false, error: 'Cozy: can du 3 anh tham chieu, hien co ' + refs.length + '/3' });
  if (!['nst', 'chrome', 'coccoc'].includes(browserType)) return res.status(400).json({ ok: false, error: 'Cozy: browser khong hop le' });

  try {
    let config;
    if (browserType === 'chrome' || browserType === 'coccoc') {
      config = {
        useNst: false,
        useCocCoc: browserType === 'coccoc',
        browserType,
        outputDir,
        projectDir,
        referenceImagePaths: refs,
        aspectRatio,
        videoCount,
        videoPlatform,
        videoStartIndex: Number(videoStartIndex) || 0,
        requireExistingFlowProject: false,
        uploadReferenceOnce: true
      };
    } else {
      const accountProfiles = resolveNstAccountProfiles(req.body || {});
      if (!accountProfiles.length) return res.status(400).json({ ok: false, error: 'Cozy: chua co NST Account hop le' });
      const selected = accountProfiles[0];
      config = {
        useNst: true,
        nstApiUrl,
        nstApiKey: selected.apiKey,
        nstProfileId: selected.profileId,
        browserType: 'nst',
        outputDir,
        projectDir,
        referenceImagePaths: refs,
        aspectRatio,
        videoCount,
        videoPlatform,
        videoStartIndex: Number(videoStartIndex) || 0,
        requireExistingFlowProject: false,
        uploadReferenceOnce: true
      };
    }

    console.log('\n[COZY V34 VIDEO] 3 REF ONE-UPLOAD ====================');
    console.log('[COZY V34 VIDEO]', videoPrompts.length, 'videos | refs:', refs);
    const result = await createCozyVideosFromExistingProject(videoPrompts, videoModel, config);
    console.log('[COZY V34 VIDEO] ====================\n');
    return res.json(result);
  } catch (e) {
    console.error('[COZY V34 VIDEO] Exception:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
// VDT_COZY_VIDEO_V34_ROUTE_END

`;
  server = server.slice(0, routePos) + route + server.slice(routePos);
}
fs.writeFileSync(SERVER, server, 'utf8');
console.log('[OK] server.js: route rieng /api/cozy/create-videos.');

// ============================================================
// 3) APP: chi Cozy goi route rieng + gui 3 path
// ============================================================
let app = fs.readFileSync(APP, 'utf8');

if (!app.includes('VDT_COZY_VIDEO_V34_APP_BEGIN')) {
  const runPos = app.indexOf('const runCreateScene = async');
  if (runPos < 0) throw new Error('app.js: khong tim thay runCreateScene.');
  const tryPos = app.indexOf('    try {', runPos);
  if (tryPos < 0 || tryPos - runPos > 9000) throw new Error('app.js: khong tim thay try tao video trong runCreateScene.');

  const appBlock = String.raw`    // VDT_COZY_VIDEO_V34_APP_BEGIN
    const v34IsCozy = (sourceTypeInput?.value || getActiveSourceFromVisibleUI?.() || '') === 'cozy';
    let v34VideoEndpoint = '/api/create-videos';
    if (v34IsCozy) {
      const v34Refs = Array.isArray(currentResult?.referenceSavedImages)
        ? currentResult.referenceSavedImages.map(x => String(x?.path || '')).filter(Boolean).slice(0, 3)
        : [];
      if (v34Refs.length !== 3) {
        setSceneVisualStatus(sceneId, 'Thieu 3 REF', 'error', 0);
        setStatus('Cozy can du 3 anh tham chieu truoc khi tao video. Hien co ' + v34Refs.length + '/3.', true);
        return false;
      }
      body.referenceImagePaths = v34Refs;
      delete body.referenceImagePath;
      v34VideoEndpoint = '/api/cozy/create-videos';
    }
    // VDT_COZY_VIDEO_V34_APP_END
`;
  app = app.slice(0, tryPos) + appBlock + app.slice(tryPos);

  const fetchPos = app.indexOf("fetch('/api/create-videos'", tryPos);
  if (fetchPos < 0 || fetchPos - tryPos > 2500) throw new Error('app.js: khong tim thay fetch /api/create-videos trong runCreateScene.');
  app = replaceAt(app, fetchPos, fetchPos + "fetch('/api/create-videos'".length, 'fetch(v34VideoEndpoint');

  const readPos = app.indexOf("readJsonOrExplain(r, '/api/create-videos')", fetchPos);
  if (readPos >= 0 && readPos - fetchPos < 1400) {
    app = replaceAt(app, readPos, readPos + "readJsonOrExplain(r, '/api/create-videos')".length, 'readJsonOrExplain(r, v34VideoEndpoint)');
  }
}

fs.writeFileSync(APP, app, 'utf8');
console.log('[OK] app.js: Cozy goi route rieng; module khac van /api/create-videos.');
console.log('[OK] V34 PATCH COMPLETE.');
