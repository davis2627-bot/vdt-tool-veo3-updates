import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const SRC = path.join(ROOT, 'src');
const flowFile = path.join(SRC, 'flowAutomation.js');
const cozyVideoFile = path.join(SRC, 'cozyVideoAutomation.js');
const serverFile = path.join(SRC, 'server.js');
const appFiles = [path.join(SRC, 'app.js'), path.join(ROOT, 'public', 'app.js')].filter(fs.existsSync);

function backup(file) {
  if (!fs.existsSync(file)) throw new Error('Khong thay file: ' + file);
  const b = file + '.before_cozy_video_v33';
  if (!fs.existsSync(b)) fs.copyFileSync(file, b);
}

function patchAppFile(file) {
  backup(file);
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('VDT_COZY_VIDEO_AUTO_RIENG_V33_APP')) {
    console.log('[OK] ' + file + ': da co V33.');
    return;
  }

  const fnStart = s.indexOf('const runCreateScene = async');
  if (fnStart < 0) throw new Error('app.js: khong tim thay runCreateScene.');
  const bodyPos = s.indexOf('const body = getVideoCreateBody([prompt], sceneId - 1);', fnStart);
  if (bodyPos < 0) throw new Error('app.js: khong tim thay getVideoCreateBody trong runCreateScene.');
  const bodyEnd = bodyPos + 'const body = getVideoCreateBody([prompt], sceneId - 1);'.length;

  const inject = `\n\n    // VDT_COZY_VIDEO_AUTO_RIENG_V33_APP\n    const v33IsCozyVideo = (sourceTypeInput?.value || '') === 'cozy';\n    const v33CozyRefs = v33IsCozyVideo && Array.isArray(currentResult?.referenceSavedImages)\n      ? currentResult.referenceSavedImages.map(x => String(x?.path || '')).filter(Boolean).slice(0, 3)\n      : [];\n    if (v33IsCozyVideo) {\n      body.referenceImagePaths = v33CozyRefs;\n      body.cozyThreeReferenceMode = true;\n    }\n    const v33CreateVideoRoute = v33IsCozyVideo ? '/api/cozy/create-videos' : '/api/create-videos';\n`;
  s = s.slice(0, bodyEnd) + inject + s.slice(bodyEnd);

  const windowEnd = Math.min(s.length, fnStart + 14000);
  let fnChunk = s.slice(fnStart, windowEnd);
  if (!fnChunk.includes("fetch('/api/create-videos'")) throw new Error('app.js: khong tim thay fetch /api/create-videos trong runCreateScene.');
  fnChunk = fnChunk.replace("fetch('/api/create-videos'", 'fetch(v33CreateVideoRoute');
  fnChunk = fnChunk.replace("readJsonOrExplain(r, '/api/create-videos')", 'readJsonOrExplain(r, v33CreateVideoRoute)');
  s = s.slice(0, fnStart) + fnChunk + s.slice(windowEnd);

  fs.writeFileSync(file, s, 'utf8');
  console.log('[OK] ' + file + ': Cozy goi route rieng /api/cozy/create-videos.');
}

function patchCozyVideoCopy() {
  backup(flowFile);
  fs.copyFileSync(flowFile, cozyVideoFile);
  let s = fs.readFileSync(cozyVideoFile, 'utf8');

  // Rename only the exported queue function in the private Cozy copy.
  if (!s.includes('export async function createVideosFromExistingProject')) {
    throw new Error('cozyVideoAutomation: khong tim thay createVideosFromExistingProject.');
  }
  s = s.replace('export async function createVideosFromExistingProject', 'export async function createCozyVideosFromExistingProject');

  // Extend generate function with a dedicated list of 3 refs.
  const sigRe = /async function generateVideoFromReference\(([^)]*?)refImagePath\s*=\s*null\)\s*\{/;
  if (!sigRe.test(s)) throw new Error('cozyVideoAutomation: khong tim thay generateVideoFromReference signature.');
  s = s.replace(sigRe, (m, before) => `async function generateVideoFromReference(${before}refImagePath = null, cozyReferenceImagePaths = []) {`);

  const attachOld = `    if (refImagePath) {\n      log('  🖼 1.85 Safe: gắn ảnh ref vào prompt, upload lại chỉ khi chưa có trong tab.');\n      await attachReferenceFileToPrompt185(page, refImagePath, log);\n    } else {\n      log('  ⚠️ Không có ref image path, tạo video chỉ bằng prompt chữ.');\n    }`;
  if (!s.includes(attachOld)) throw new Error('cozyVideoAutomation: khong tim thay block attach ref hien tai.');
  const attachNew = `    // VDT_COZY_VIDEO_AUTO_RIENG_V33_ATTACH\n    const cozyRefs = Array.isArray(cozyReferenceImagePaths)\n      ? cozyReferenceImagePaths.map(p => String(p || '').trim()).filter(Boolean).slice(0, 3)\n      : [];\n    if (cozyRefs.length === 3) {\n      log('  🧸 COZY V33: gắn đủ REF 1 → REF 2 → REF 3 trước khi dán prompt video.');\n      for (let ri = 0; ri < 3; ri++) {\n        const refPath = cozyRefs[ri];\n        if (!existsSync(refPath)) throw new Error('Thiếu REF ' + (ri + 1) + ': ' + refPath);\n        log('  🖼 COZY REF ' + (ri + 1) + '/3: ' + refPath);\n        await attachReferenceFileToPrompt185(page, refPath, log);\n        await humanDelay(2200, 3600, log);\n      }\n      log('  ✅ COZY V33: đủ 3/3 REF. Bây giờ mới dán prompt video.');\n    } else if (refImagePath) {\n      await attachReferenceFileToPrompt185(page, refImagePath, log);\n    } else {\n      throw new Error('Cozy V33 chưa nhận đủ 3 ảnh tham chiếu.');\n    }`;
  s = s.replace(attachOld, attachNew);

  const fnStart = s.indexOf('export async function createCozyVideosFromExistingProject');
  if (fnStart < 0) throw new Error('cozyVideoAutomation: rename export that bai.');
  const outputCheck = s.indexOf("if (!config.outputDir) return { ok: false, error: 'Chưa chọn thư mục lưu' };", fnStart);
  if (outputCheck < 0) throw new Error('cozyVideoAutomation: khong tim thay outputDir check.');
  const outputCheckEnd = outputCheck + "if (!config.outputDir) return { ok: false, error: 'Chưa chọn thư mục lưu' };".length;
  const validate = `\n  // VDT_COZY_VIDEO_AUTO_RIENG_V33_VALIDATE\n  const cozyRefsV33 = Array.isArray(config?.referenceImagePaths)\n    ? config.referenceImagePaths.map(p => String(p || '').trim()).filter(Boolean).slice(0, 3)\n    : [];\n  if (cozyRefsV33.length !== 3) return { ok: false, error: 'Cozy V33 cần đúng 3 ảnh tham chiếu, hiện có ' + cozyRefsV33.length + '/3.', logs };\n  const missingCozyRefs = cozyRefsV33.filter(p => !existsSync(p));\n  if (missingCozyRefs.length) return { ok: false, error: 'Thiếu file ảnh Cozy: ' + missingCozyRefs.join(' | '), logs };\n  config.referenceImagePaths = cozyRefsV33;\n  config.referenceImagePath = cozyRefsV33[0];\n  log('🧸 COZY VIDEO AUTO RIÊNG V33 — khóa đủ 3 REF.');\n`;
  s = s.slice(0, outputCheckEnd) + validate + s.slice(outputCheckEnd);

  // Patch the generate call inside the exported Cozy queue only.
  const callPos = s.indexOf('const vidPath = await generateVideoFromReference(', fnStart);
  if (callPos < 0) throw new Error('cozyVideoAutomation: khong tim thay generate call trong Cozy queue.');
  const callClose = s.indexOf(');', callPos);
  if (callClose < 0 || callClose - callPos > 1800) throw new Error('cozyVideoAutomation: generate call qua dai/khong hop le.');
  let call = s.slice(callPos, callClose + 2);
  if (!/refImagePath\s*\n?\s*\);$/.test(call)) throw new Error('cozyVideoAutomation: doi so cuoi khong phai refImagePath.');
  call = call.replace(/refImagePath\s*\n?\s*\);$/, 'refImagePath,\n          config.referenceImagePaths\n        );');
  s = s.slice(0, callPos) + call + s.slice(callClose + 2);

  fs.writeFileSync(cozyVideoFile, s, 'utf8');
  console.log('[OK] Da tao src\\cozyVideoAutomation.js rieng. flowAutomation.js KHONG bi sua.');
}

function patchServer() {
  backup(serverFile);
  let s = fs.readFileSync(serverFile, 'utf8');
  if (!s.includes("from './cozyVideoAutomation.js'")) {
    const firstImportEnd = s.indexOf('\n', s.indexOf('import '));
    if (firstImportEnd < 0) throw new Error('server.js: khong tim thay import.');
    s = s.slice(0, firstImportEnd + 1) + "import { createCozyVideosFromExistingProject } from './cozyVideoAutomation.js';\n" + s.slice(firstImportEnd + 1);
  }

  if (!s.includes("app.post('/api/cozy/create-videos'")) {
    const anchor = s.indexOf("app.post('/api/create-videos'");
    if (anchor < 0) throw new Error('server.js: khong tim thay /api/create-videos.');
    const route = `\n// VDT_COZY_VIDEO_AUTO_RIENG_V33_ROUTE\napp.post('/api/cozy/create-videos', express.json(), async (req, res) => {\n  const { videoPrompts = [], outputDir = '', projectDir = '', referenceImagePaths = [], browserType = 'nst', nstApiUrl = 'http://localhost:8848/api/v2', videoModel = 'Veo 3.1 - Lite', aspectRatio = '16:9', videoCount = '1x', videoStartIndex = 0 } = req.body || {};\n  if (!Array.isArray(videoPrompts) || !videoPrompts.length) return res.status(400).json({ ok: false, error: 'Thiếu videoPrompts Cozy' });\n  if (!outputDir) return res.status(400).json({ ok: false, error: 'Chưa chọn thư mục lưu video' });\n  const refs = Array.isArray(referenceImagePaths) ? referenceImagePaths.map(x => String(x || '').trim()).filter(Boolean).slice(0, 3) : [];\n  if (refs.length !== 3) return res.status(400).json({ ok: false, error: 'Cozy cần đủ đúng 3 ảnh tham chiếu. Hiện có ' + refs.length + '/3.' });\n  if (!['nst', 'chrome', 'coccoc'].includes(browserType)) return res.status(400).json({ ok: false, error: 'Browser Cozy không hợp lệ.' });\n\n  try {\n    let config;\n    if (browserType === 'nst') {\n      const accounts = resolveNstAccountProfiles(req.body || {});\n      if (!accounts.length) return res.status(400).json({ ok: false, error: 'Chưa có NST Account hợp lệ.' });\n      const selected = accounts[0];\n      config = { useNst: true, nstApiUrl, nstApiKey: selected.apiKey, nstProfileId: selected.profileId, browserType: 'nst', outputDir, projectDir, referenceImagePaths: refs, referenceImagePath: refs[0], aspectRatio, videoCount, videoPlatform: 'veo3', videoStartIndex: Number(videoStartIndex) || 0, requireExistingFlowProject: false, uploadReferenceOnce: false, allowTextOnly: false };\n    } else {\n      config = { useNst: false, useCocCoc: browserType === 'coccoc', browserType, outputDir, projectDir, referenceImagePaths: refs, referenceImagePath: refs[0], aspectRatio, videoCount, videoPlatform: 'veo3', videoStartIndex: Number(videoStartIndex) || 0, requireExistingFlowProject: false, uploadReferenceOnce: false, allowTextOnly: false };\n    }\n    console.log('\\n[COZY VIDEO AUTO RIENG V33] ====================');\n    console.log('[COZY V33]', videoPrompts.length, 'scene(s) | 3 REF |', browserType);\n    const result = await createCozyVideosFromExistingProject(videoPrompts, videoModel, config);\n    return res.json(result);\n  } catch (e) {\n    console.error('[COZY V33] Exception:', e.message);\n    return res.status(500).json({ ok: false, error: e.message });\n  }\n});\n\n`;
    s = s.slice(0, anchor) + route + s.slice(anchor);
  }
  fs.writeFileSync(serverFile, s, 'utf8');
  console.log('[OK] server.js: them route rieng /api/cozy/create-videos.');
}

patchCozyVideoCopy();
patchServer();
for (const f of appFiles) patchAppFile(f);
console.log('');
console.log('[OK] V33 HOAN TAT:');
console.log(' - flowAutomation.js: KHONG SUA');
console.log(' - cozyFlowAutomation.js: KHONG SUA');
console.log(' - cozyVideoAutomation.js: AUTO VIDEO COZY RIENG');
console.log(' - Cozy route: /api/cozy/create-videos');
