const FRAME_MAX_SIZE = 340;
const FRAME_MIN_SIZE = 224;
const FRAME_BODY_STANDARD_PADDING = 32;
const FRAME_BODY_COMPACT_PADDING = 20;
const FRAME_HEIGHT_RESERVE = 12;
const HEADER_HEIGHT_ESTIMATE = 96;
const CONTROLS_HEIGHT_ESTIMATE = 228;
const WIDTH_PADDING = 40;

export type ScannerFrameLayout = {
  bodyMinHeight: number;
  frameSize: number;
  isCompact: boolean;
};

export type ScannerFrameLayoutInput = {
  controlsHeight: number;
  headerHeight: number;
  windowHeight: number;
  windowWidth: number;
};

function resolveMeasuredHeight(
  measuredHeight: number,
  fallbackHeight: number
): number {
  return measuredHeight > 0 ? measuredHeight : fallbackHeight;
}

function clampFrameSize(maxFrameSize: number): number {
  return Math.floor(Math.max(maxFrameSize, 1));
}

export function getScannerFrameLayout(
  input: ScannerFrameLayoutInput
): ScannerFrameLayout {
  const headerHeight = resolveMeasuredHeight(
    input.headerHeight,
    HEADER_HEIGHT_ESTIMATE
  );
  const controlsHeight = resolveMeasuredHeight(
    input.controlsHeight,
    CONTROLS_HEIGHT_ESTIMATE
  );
  const widthLimitedFrame = Math.floor(input.windowWidth - WIDTH_PADDING);
  const availableBodyHeight = Math.max(
    input.windowHeight - headerHeight - controlsHeight - FRAME_HEIGHT_RESERVE,
    1
  );

  const standardFrameLimit = Math.min(
    FRAME_MAX_SIZE,
    widthLimitedFrame,
    availableBodyHeight - FRAME_BODY_STANDARD_PADDING
  );

  if (standardFrameLimit >= FRAME_MIN_SIZE) {
    const frameSize = clampFrameSize(standardFrameLimit);
    return {
      bodyMinHeight: frameSize + FRAME_BODY_STANDARD_PADDING,
      frameSize,
      isCompact: frameSize < FRAME_MAX_SIZE,
    };
  }

  const compactFrameLimit = Math.min(
    FRAME_MAX_SIZE,
    widthLimitedFrame,
    availableBodyHeight - FRAME_BODY_COMPACT_PADDING
  );
  const frameSize = clampFrameSize(compactFrameLimit);

  return {
    bodyMinHeight: frameSize + FRAME_BODY_COMPACT_PADDING,
    frameSize,
    isCompact: true,
  };
}
