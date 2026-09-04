import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const srcDir = path.join(ROOT, 'src');
const flowFile = path.join(srcDir, 'flowAutomation.js');
const cozyVideoFile = path.join(srcDir, 'cozyVideoAutomation.js');
const appFile = path.join(srcDir, 'app.js');
const serverFile = path.join(srcDir, 'server.js');

function need(file) {
  if (!fs.existsSync(file)) throw new Error('Khong thay file: ' + file);
}
function backup(file, suffix = '.before_cozy_video_v35') {
  const b = file + suffix;
  if (fs.existsSync(file) && !fs.existsSync(b)) fs.copyFileSync(file, b);
}
function write(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

[flowFile, appFile, serverFile].forEach(need);
[flowFile, appFile, serverFile].forEach(f => backup(f));
if (fs.existsSync(cozyVideoFile)) backup(cozyVideoFile);

// ============================================================
// 1) TAO AUTO VIDEO COZY RIENG: COPY NGUYEN AUTO CHUNG HIEN TAI
//    ROI CHI APPEND EXPORT MOI. KHONG SUA flowAutomation.js.
// ============================================================
let cozy = fs.readFileSync(flowFile, 'utf8');

if (!cozy.includes('async function generateVideoFromReference(')) {
  throw new Error('cozyVideoAutomation V35: flowAutomation hien tai khong co generateVideoFromReference().');
}
if (!cozy.includes('async function ensureVideoConfigOnce185(')) {
  throw new Error('cozyVideoAutomation V35: thieu ensureVideoConfigOnce185().');
}
if (!cozy.includes('async function findPlusAssetButtonBox(')) {
  throw new Error('cozyVideoAutomation V35: thieu findPlusAssetButtonBox().');
}
if (!cozy.includes('async function waitForAddToPromptAfterUpload185(')) {
  throw new Error('cozyVideoAutomation V35: thieu waitForAddToPromptAfterUpload185().');
}

// Xoa V35 cu neu cai lai.
cozy = cozy.replace(/\n?\/\/ VDT_COZY_VIDEO_AUTO_RIENG_V35_BEGIN[\s\S]*?\/\/ VDT_COZY_VIDEO_AUTO_RIENG_V35_END\s*$/m, '\n');

const addon = String.raw`

// VDT_COZY_VIDEO_AUTO_RIENG_V35_BEGIN
// AUTO VIDEO COZY RIENG HOAN TOAN.
// KHONG SUA flowAutomation.js.
// MOI CANH: NEW PROJECT -> VIDEO -> UPLOAD 1 LAN 3 REF -> ADD 1/2/3 -> PROMPT -> GENERATE.

async function cozyV35VisibleUploadMediaBox(page) {
  return await page.evaluate(() => {
    const deepAll = (root) => {
      const out = [];
      const walk = (r) => {
        const els = r.querySelectorAll ? r.querySelectorAll('*') : [];
        for (const el of els) {
          out.push(el);
          if (el.shadowRoot) walk(el.shadowRoot);
        }
      };
      walk(root);
      return out;
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect?.();
      if (!r || r.width < 20 || r.height < 16) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.08;
    };
    const all = deepAll(document);
    const candidates = all.filter(el => {
      if (!el.matches?.('button,[role="button"],div,span')) return false;
      if (!visible(el)) return false;
      const label = `${el.textContent || ''} ${el.getAttribute?.('aria-label') || ''} ${el.getAttribute?.('title') || ''}`.toLowerCase();
      return label.includes('upload media') ||
             label.includes('media uploads') ||
             label.includes('tải nội dung nghe nhìn lên') ||
             label.includes('tải nội dung') ||
             label.includes('tải lên');
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const score = (el, r) => {
        const label = `${el.textContent || ''} ${el.getAttribute?.('aria-label') || ''}`.toLowerCase();
        const exact = label.includes('upload media') || label.includes('tải nội dung nghe nhìn lên') ? -120 : 0;
        return exact + Math.abs((r.top + r.height / 2) - window.innerHeight * 0.75) + r.left / 40;
      };
      return score(a, ar) - score(b, br);
    });
    const el = candidates[0];
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      width: r.width,
      height: r.height,
      text: (el.textContent || el.getAttribute?.('aria-label') || '').trim().slice(0, 100)
    };
  }).catch(() => null);
}

async function cozyV35UploadThreeAtOnce(page, refs, log) {
  if (!Array.isArray(refs) || refs.length !== 3) {
    throw new Error('COZY V35 can dung dung 3 anh tham chieu.');
  }
  for (let i = 0; i < refs.length; i++) {
    if (!existsSync(refs[i])) throw new Error(`COZY V35 khong thay REF ${i + 1}: ${refs[i]}`);
  }

  log('📤 COZY V35: UPLOAD 1 LAN CUNG LUC 3 REF.');
  refs.forEach((p, i) => log(`   REF ${i + 1}: ${p}`));

  const plusBox = await findPlusAssetButtonBox(page);
  if (!plusBox) throw new Error('COZY V35: khong tim thay dau + assets.');
  await humanMoveAndClickBox(page, plusBox, log, 'dau + assets Cozy V35');
  await humanDelay(650, 1100, log);

  const uploadBox = await cozyV35VisibleUploadMediaBox(page);
  let chooser = null;
  if (uploadBox) {
    const chooserPromise = page.waitForFileChooser({ timeout: 12000 }).catch(() => null);
    await humanMoveAndClickBox(page, uploadBox, log, uploadBox.text ? `Upload media (${uploadBox.text})` : 'Upload media');
    chooser = await chooserPromise;
  }

  if (chooser) {
    await chooser.accept(refs);
    log('✅ COZY V35: file chooser da nhan cung luc 3 REF.');
  } else {
    let fileInput = null;
    for (let i = 0; i < 30; i++) {
      const inputs = await page.$$('input[type="file"]');
      if (inputs.length) {
        fileInput = inputs[inputs.length - 1];
        break;
      }
      await sleep(350);
    }
    if (!fileInput) throw new Error('COZY V35: khong tim thay input file de upload 3 REF.');
    await fileInput.uploadFile(...refs);
    log('✅ COZY V35: hidden input da nhan cung luc 3 REF.');
  }

  await humanDelay(4500, 6500, log);

  // Anh 1: sau batch upload Flow thuong da chon san anh dau tien.
  // Khong bam thumbnail/card. Chi cho Add to Prompt sang va bam.
  for (let index = 0; index < 3; index++) {
    if (index > 0) {
      const p = await findPlusAssetButtonBox(page);
      if (!p) throw new Error(`COZY V35: khong tim thay dau + de Add REF ${index + 1}/3.`);
      await humanMoveAndClickBox(page, p, log, `dau + REF ${index + 1}/3`);
      await humanDelay(700, 1200, log);
    }

    log(`⏳ COZY V35 REF ${index + 1}/3: cho Add to Prompt sang, KHONG bam thumbnail.`);
    const addBox = await waitForAddToPromptAfterUpload185(page, log, 30000);
    if (!addBox) throw new Error(`COZY V35: REF ${index + 1}/3 chua co Add to Prompt.`);

    await humanMoveAndClickBox(page, addBox, log, `Add to Prompt REF ${index + 1}/3`);
    await humanDelay(1800, 2800, log);

    // Neu popup van con va Add van con, bam lai chinh Add mot lan; khong cham card anh.
    const stillAdd = await findAddToPromptBox(page).catch(() => null);
    if (stillAdd) {
      await humanMoveAndClickBox(page, stillAdd, log, `Add to Prompt REF ${index + 1}/3 lan 2`);
      await humanDelay(1500, 2400, log);
    }

    log(`✅ COZY V35 REF ${index + 1}/3: da bam Add to Prompt.`);
  }

  log('✅ COZY V35: DA ADD DU 3/3 REF. BAY GIO MOI DUOC DAN PROMPT VIDEO.');
  return true;
}

export async function createCozyVideosWithThreeReferences(videoPrompts, videoModel, config = {}) {
  const logs = [];
  const log = (msg) => { logs.push(msg); console.log('[cozy-video-v35]', msg); };

  if (!Array.isArray(videoPrompts) || !videoPrompts.length) return { ok: false, error: 'Khong co videoPrompts', logs };
  if (!config.outputDir) return { ok: false, error: 'Chua chon thu muc luu video', logs };

  const refs = Array.isArray(config.referenceImagePaths)
    ? config.referenceImagePaths.map(p => path.resolve(String(p || '').trim())).filter(Boolean).slice(0, 3)
    : [];
  if (refs.length !== 3) return { ok: false, error: `COZY V35 can du 3 REF, hien co ${refs.length}/3.`, logs };
  const missing = refs.filter(p => !existsSync(p));
  if (missing.length) return { ok: false, error: 'Thieu file REF: ' + missing.join(' | '), logs };

  await cleanupFirstFrameImagesV118(config.outputDir, log);
  const startIndex = Number(config.videoStartIndex || 0);
  let browser = null;

  try {
    browser = await getBrowser(config);
    let page = await findFlowProjectPage(browser);
    if (!page) {
      page = await browser.newPage();
      await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await humanDelay(1000, 1800, log);
    }

    page = await openFreshFlowBaseForVideo(browser, page, log);
    await page.bringToFront().catch(() => {});
    await ensureFlowProjectReady(page, log);

    const videoResults = [];
    for (let i = 0; i < videoPrompts.length; i++) {
      const videoNum = startIndex + i + 1;
      const prompt = typeof videoPrompts[i] === 'string' ? videoPrompts[i] : String(videoPrompts[i]?.prompt || '');

      try {
        // Moi canh tu canh 2 tro di: project moi sach, khong reuse asset/card canh truoc.
        if (i > 0) {
          log(`♻️ COZY V35 Cảnh ${videoNum}: ve Flow Home -> New project sach.`);
          await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
          await humanDelay(1100, 1900, log);
          await ensureFlowProjectReady(page, log);
        }

        const targetRatio = normalizeFlowAspectRatio(config.aspectRatio || '16:9');
        await ensureVideoConfigOnce185(page, log, targetRatio);
        await closeVideoSettingsPanelAndFocusPrompt185(page, log);

        await cozyV35UploadThreeAtOnce(page, refs, log);

        // 3 REF da nam trong composer. Goi ham video cu voi ref=null de no KHONG upload them 1 ref nua.
        const vidPath = await generateVideoFromReference(
          page,
          prompt,
          videoNum,
          config.outputDir,
          videoModel || 'Veo 3.1 - Lite',
          targetRatio,
          config.videoCount || '1x',
          log,
          null
        );

        videoResults.push({ index: videoNum, ok: true, path: vidPath, prompt: prompt.slice(0, 100) });
        await humanDelay(900, 1600, log);
      } catch (e) {
        log(`❌ COZY V35 Video #${videoNum} loi: ${e.message}`);
        videoResults.push({ index: videoNum, ok: false, error: e.message, prompt: prompt.slice(0, 100) });
        log('🛑 COZY V35 dung tai canh loi; khong nhay sang canh ke tiep.');
        break;
      }
    }

    const successCount = videoResults.filter(r => r.ok).length;
    const totalCount = videoPrompts.length;
    const allOk = videoResults.length === totalCount && successCount === totalCount;
    await cleanupFirstFrameImagesV118(config.outputDir, log).catch(() => {});
    await closeToolBrowserAfterVideoQueueV118(browser, {
      expectedCount: totalCount,
      videoResults,
      browserType: config.browserType
    }, log).catch(() => {});

    return {
      ok: successCount > 0,
      allOk,
      completedCount: successCount,
      totalCount,
      progress: totalCount ? Math.round(successCount / totalCount * 100) : 100,
      logs,
      videoResults
    };
  } catch (e) {
    await cleanupFirstFrameImagesV118(config.outputDir, log).catch(() => {});
    log('❌ COZY V35 loi: ' + e.message);
    return { ok: false, error: e.message, logs };
  }
}
// VDT_COZY_VIDEO_AUTO_RIENG_V35_END
`;

cozy += addon;
write(cozyVideoFile, cozy);
console.log('[OK] Tao src\\cozyVideoAutomation.js V35 tu flowAutomation hien tai + export Cozy rieng.');
console.log('[OK] flowAutomation.js KHONG bi sua.');

// ============================================================
// 2) SERVER: IMPORT + ROUTE RIENG /api/cozy/create-videos
// ============================================================
let server = fs.readFileSync(serverFile, 'utf8');

if (!server.includes("from './cozyVideoAutomation.js'")) {
  const flowImport = /import\s*\{[^\n]*createVideosFromExistingProject[^\n]*\}\s*from\s*['"]\.\/flowAutomation\.js['"];?/;
  const m = server.match(flowImport);
  if (!m) throw new Error('server.js: khong tim thay import flowAutomation de chen import Cozy V35.');
  server = server.replace(m[0], m[0] + "\nimport { createCozyVideosWithThreeReferences } from './cozyVideoAutomation.js';");
}

if (!server.includes("app.post('/api/cozy/create-videos'")) {
  const anchor = "app.post('/api/create-videos', express.json(), async (req, res) => {";
  const pos = server.indexOf(anchor);
  if (pos < 0) throw new Error('server.js: khong tim thay route /api/create-videos de chen route Cozy.');

  const route = String.raw`
// VDT_COZY_VIDEO_AUTO_RIENG_V35_ROUTE_BEGIN
app.post('/api/cozy/create-videos', express.json(), async (req, res) => {
  const {
    videoPrompts = [], outputDir = '', projectDir = '', referenceImagePaths = [],
    browserType = 'nst', nstApiUrl = 'http://localhost:8848/api/v2',
    videoModel = 'Veo 3.1 - Lite', aspectRatio = '16:9', videoCount = '1x',
    videoPlatform = 'veo3', videoStartIndex = 0
  } = req.body || {};

  if (!Array.isArray(videoPrompts) || !videoPrompts.length) return res.status(400).json({ ok: false, error: 'Thieu videoPrompts' });
  if (!outputDir) return res.status(400).json({ ok: false, error: 'Chua chon thu muc luu video' });
  if (!Array.isArray(referenceImagePaths) || referenceImagePaths.filter(Boolean).length !== 3) {
    return res.status(400).json({ ok: false, error: 'Cozy can dung du 3 anh tham chieu.' });
  }
  if (!['nst', 'chrome', 'coccoc'].includes(browserType)) return res.status(400).json({ ok: false, error: 'BrowserType khong hop le.' });

  const config = {
    outputDir, projectDir, referenceImagePaths: referenceImagePaths.filter(Boolean).slice(0, 3),
    aspectRatio, videoCount, videoPlatform, videoStartIndex: Number(videoStartIndex) || 0,
    browserType, useNst: browserType === 'nst', useCocCoc: browserType === 'coccoc'
  };

  if (browserType === 'nst') {
    const profiles = resolveNstAccountProfiles(req.body || {});
    if (!profiles.length) return res.status(400).json({ ok: false, error: 'Chua co NST Account hop le.' });
    const selected = profiles[0];
    Object.assign(config, {
      nstApiUrl,
      nstApiKey: selected.apiKey,
      nstProfileId: selected.profileId
    });
  }

  console.log('\n[cozy-create-videos V35] ====================');
  console.log('[cozy-create-videos V35]', videoPrompts.length, 'video | 3 REF batch upload | browser:', browserType);
  try {
    const result = await createCozyVideosWithThreeReferences(videoPrompts, videoModel, config);
    console.log('[cozy-create-videos V35] KQ:', result.ok ? 'OK' : 'LOI ' + result.error);
    console.log('[cozy-create-videos V35] ====================\n');
    return res.json(result);
  } catch (e) {
    console.error('[cozy-create-videos V35] Exception:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
// VDT_COZY_VIDEO_AUTO_RIENG_V35_ROUTE_END

`;
  server = server.slice(0, pos) + route + server.slice(pos);
}
write(serverFile, server);
console.log('[OK] server.js: route rieng /api/cozy/create-videos V35.');

// ============================================================
// 3) APP: COZY GUI 3 PATH + GOI ROUTE RIENG.
// ============================================================
let app = fs.readFileSync(appFile, 'utf8');

if (!app.includes('VDT_COZY_VIDEO_AUTO_RIENG_V35_APP_REFS')) {
  // Neu cac ban V29/V31 da co body.referenceImagePaths thi khong chen lai block refs.
  if (!app.includes('body.referenceImagePaths')) {
    const anchor = "    if (body.browserType === 'nst' && !body.nstAccounts?.length) {";
    const pos = app.indexOf(anchor);
    if (pos < 0) throw new Error('app.js: khong tim thay cho chen 3 REF Cozy V35.');
    const block = String.raw`    // VDT_COZY_VIDEO_AUTO_RIENG_V35_APP_REFS
    const v35IsCozy = (typeof getActiveSourceFromVisibleUI === 'function' ? getActiveSourceFromVisibleUI() : (sourceTypeInput?.value || '')) === 'cozy';
    if (v35IsCozy) {
      const v35Refs = Array.isArray(currentResult?.referenceSavedImages)
        ? currentResult.referenceSavedImages.map(x => String(x?.path || '')).filter(Boolean).slice(0, 3)
        : [];
      if (v35Refs.length !== 3) {
        setSceneVisualStatus(sceneId, 'Thieu 3 REF', 'error', 0);
        setStatus(\`❌ Cozy can du 3 anh tham chieu. Hien co \${v35Refs.length}/3.\`, true);
        return false;
      }
      body.referenceImagePaths = v35Refs;
    }
`;
    app = app.slice(0, pos) + block + app.slice(pos);
  } else {
    app = app.replace('body.referenceImagePaths', '/* VDT_COZY_VIDEO_AUTO_RIENG_V35_APP_REFS */ body.referenceImagePaths');
  }
}

if (!app.includes('VDT_COZY_VIDEO_AUTO_RIENG_V35_ENDPOINT')) {
  const oldFetch = "      const r = await fetch('/api/create-videos', {";
  const pos = app.indexOf(oldFetch);
  if (pos < 0) throw new Error('app.js: khong tim thay fetch /api/create-videos cua runCreateScene.');
  const replacement = `      // VDT_COZY_VIDEO_AUTO_RIENG_V35_ENDPOINT\n      const v35VideoEndpoint = ((typeof getActiveSourceFromVisibleUI === 'function' ? getActiveSourceFromVisibleUI() : (sourceTypeInput?.value || '')) === 'cozy')\n        ? '/api/cozy/create-videos'\n        : '/api/create-videos';\n      const r = await fetch(v35VideoEndpoint, {`;
  app = app.slice(0, pos) + replacement + app.slice(pos + oldFetch.length);

  // Chỉ thay readJson ngay sau fetch vừa sửa.
  const readOld = "      const data = await readJsonOrExplain(r, '/api/create-videos');";
  const readPos = app.indexOf(readOld, pos);
  if (readPos >= 0) {
    app = app.slice(0, readPos) + "      const data = await readJsonOrExplain(r, v35VideoEndpoint);" + app.slice(readPos + readOld.length);
  }
}

write(appFile, app);
console.log('[OK] app.js: Cozy goi /api/cozy/create-videos, module khac van /api/create-videos.');

console.log('');
console.log('============================================================');
console.log('[OK] V35 PATCH XONG');
console.log('- flowAutomation.js      : KHONG SUA');
console.log('- cozyFlowAutomation.js  : KHONG SUA');
console.log('- cozyVideoAutomation.js : AUTO VIDEO COZY RIENG');
console.log('- Cozy upload            : 1 LAN CUNG LUC 3 REF');
console.log('- Route Cozy             : /api/cozy/create-videos');
console.log('============================================================');
