    // VDT_COZY_VIDEO_AUTO_RIENG_V35_APP_REFS
    const v35IsCozy = (typeof getActiveSourceFromVisibleUI === 'function' ? getActiveSourceFromVisibleUI() : (sourceTypeInput?.value || '')) === 'cozy';
    if (v35IsCozy) {
      const v35Refs = Array.isArray(currentResult?.referenceSavedImages)
        ? currentResult.referenceSavedImages.map(x => String(x?.path || '')).filter(Boolean).slice(0, 3)
        : [];
      if (v35Refs.length !== 3) {
        setSceneVisualStatus(sceneId, 'Thieu 3 REF', 'error', 0);
        setStatus(`❌ Cozy can du 3 anh tham chieu. Hien co ${v35Refs.length}/3.`, true);
        return false;
      }
      body.referenceImagePaths = v35Refs;
    }
