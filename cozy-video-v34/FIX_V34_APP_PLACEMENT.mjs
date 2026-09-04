import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.VDT_ROOT || 'D:\\VDT TOOL VEO 3';
const APP = path.join(ROOT, 'src', 'app.js');
if (!fs.existsSync(APP)) throw new Error('Khong thay app.js');

let app = fs.readFileSync(APP, 'utf8');

// Xoa block V34 neu patch chinh da chen vao vi tri try dau tien.
app = app.replace(/\s*\/\/ VDT_COZY_VIDEO_V34_APP_BEGIN[\s\S]*?\/\/ VDT_COZY_VIDEO_V34_APP_END\s*/g, '\n');

const runPos = app.indexOf('const runCreateScene = async');
if (runPos < 0) throw new Error('app.js: khong tim thay runCreateScene.');

const anchor = "    setSceneVisualStatus(sceneId, 'Đang tạo', 'running', 15);";
const anchorPos = app.indexOf(anchor, runPos);
if (anchorPos < 0 || anchorPos - runPos > 12000) {
  throw new Error('app.js: khong tim thay anchor Dang tao trong runCreateScene.');
}

const block = String.raw`    // VDT_COZY_VIDEO_V34_APP_BEGIN
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

app = app.slice(0, anchorPos) + block + app.slice(anchorPos);

// Bao dam fetch cua runCreateScene dung endpoint bien.
let fetchPos = app.indexOf("fetch('/api/create-videos'", anchorPos);
if (fetchPos >= 0 && fetchPos - anchorPos < 3000) {
  app = app.slice(0, fetchPos) + 'fetch(v34VideoEndpoint' + app.slice(fetchPos + "fetch('/api/create-videos'".length);
}
let readPos = app.indexOf("readJsonOrExplain(r, '/api/create-videos')", anchorPos);
if (readPos >= 0 && readPos - anchorPos < 4000) {
  app = app.slice(0, readPos) + 'readJsonOrExplain(r, v34VideoEndpoint)' + app.slice(readPos + "readJsonOrExplain(r, '/api/create-videos')".length);
}

fs.writeFileSync(APP, app, 'utf8');
console.log('[OK] V34 app block da dat SAU khi body duoc tao, ngay truoc status Dang tao.');
