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
