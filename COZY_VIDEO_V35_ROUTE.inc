// VDT_COZY_VIDEO_AUTO_RIENG_V35_ROUTE_BEGIN
app.post('/api/cozy/create-videos-v35', express.json(), async (req, res) => {
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
