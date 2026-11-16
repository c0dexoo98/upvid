import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CHARACTER,
  computeCameraTransform,
  computeTimelineStats,
  createSampleYouTubeScenes,
  findActiveSceneAtTime,
  formatTimecode,
  isRtlText,
  normalizeSceneTimings,
  sanitizeSvgMarkup,
  splitWordTokens,
} from './studioLogic';

test('formatTimecode formats seconds cleanly with tenths', () => {
  assert.equal(formatTimecode(0), '00:00.0');
  assert.equal(formatTimecode(65.4), '01:05.4');
  assert.equal(formatTimecode(-4), '00:00.0');
});

test('isRtlText detects Persian/Arabic vs English text', () => {
  assert.equal(isRtlText('سلام یوتیوب'), true);
  assert.equal(isRtlText('Stickman Studio'), false);
});

test('normalizeSceneTimings keeps scenes contiguous and scales to audio duration', () => {
  const sample = createSampleYouTubeScenes('en');
  const scaled = normalizeSceneTimings(sample, 20);
  assert.equal(scaled.length, 4);
  assert.equal(scaled[0].startTime, 0);
  assert.equal(scaled[scaled.length - 1].endTime, 20);
  for (let i = 1; i < scaled.length; i++) {
    assert.equal(scaled[i].startTime, scaled[i - 1].endTime);
  }
});

test('findActiveSceneAtTime locates correct scene and transition progress', () => {
  const sample = createSampleYouTubeScenes('en');
  const atStart = findActiveSceneAtTime(sample, 0.1);
  assert.equal(atStart.scene?.id, 'scene-1');
  assert.equal(atStart.scene?.sceneRole, 'hook');
  assert.ok(atStart.transitionProgress < 1);

  const atEnd = findActiveSceneAtTime(sample, 11.2);
  assert.equal(atEnd.scene?.sceneRole, 'cta-outro');
});

test('computeCameraTransform produces zoom-in and zoom-out scale curves', () => {
  const zoomInStart = computeCameraTransform('zoom-in', 0, 'cut', 1, 0);
  const zoomInEnd = computeCameraTransform('zoom-in', 1, 'cut', 1, 3);
  assert.ok(zoomInEnd.scale > zoomInStart.scale);

  const zoomOutStart = computeCameraTransform('zoom-out', 0, 'cut', 1, 0);
  const zoomOutEnd = computeCameraTransform('zoom-out', 1, 'cut', 1, 3);
  assert.ok(zoomOutStart.scale > zoomOutEnd.scale);

  const flashEntry = computeCameraTransform('static', 0.02, 'flash-cut', 0.1, 0.05);
  assert.ok(flashEntry.flashOpacity > 0.3);
});

test('splitWordTokens marks highlight word accurately', () => {
  const tokens = splitWordTokens('Like, Subscribe & Watch Next', 'Subscribe');
  assert.equal(tokens.length, 5);
  assert.equal(tokens[1].isHighlight, true);
  assert.equal(tokens[0].isHighlight, false);

  const faTokens = splitWordTokens('راز شکست ۹۰٪ کانال‌ها', '۹۰٪');
  assert.equal(faTokens[2].isHighlight, true);
});

test('computeTimelineStats calculates pace and completion metrics', () => {
  const sample = createSampleYouTubeScenes('fa');
  const stats = computeTimelineStats(sample);
  assert.equal(stats.sceneCount, 4);
  assert.equal(stats.totalDuration, 13);
  assert.equal(stats.readyCount, 4);
  assert.equal(stats.completionPercent, 100);
  assert.ok(stats.cutsPerMinute >= 15);
  assert.equal(DEFAULT_CHARACTER.styleMode, 'comic-classic');
});

test('sanitizeSvgMarkup strips dangerous tags while keeping valid svg', () => {
  const safe = sanitizeSvgMarkup('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" onclick="alert(1)"/><script>alert(1)</script></svg>');
  assert.ok(safe);
  assert.equal(safe.includes('<script'), false);
  assert.equal(safe.includes('onclick'), false);
  assert.equal(sanitizeSvgMarkup('<div>not svg</div>'), null);
});
