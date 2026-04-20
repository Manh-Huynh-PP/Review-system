const fs = require('fs');
const filePath = 'e:\\FREELANCE\\linkweb\\Review-system\\src\\components\\shared\\FileViewDialogShared.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Replace Image Compare Mode
let imgStart = lines.findIndex(l => l.includes('// Compare mode: show two images side-by-side with version selectors')) - 1; // get `if (compareMode) {`
let imgEnd = -1;
for (let i = imgStart + 1; i < lines.length; i++) {
  if (lines[i].includes('// Slider overlay mode using react-compare-slider')) {
    // skip past this
  }
  if (lines[i].includes('Sequence Navigation Controls Overlay for Compare Mode')) {
     // skip past this
  }
  if (lines[i].includes('return (') && lines[i+1].includes('ref={sequenceFullscreenRef as any}')) {
    // This is the return after image compare block!
    imgEnd = i - 3; // The `      }` before `      return (`
    break;
  }
}

if (imgStart !== -2 && imgEnd !== -1) {
  const replacementImage = `      // Compare mode: show two images side-by-side with version selectors
      if (compareMode) {
        return (
          <ImageCompareMode
            uniqueVersions={uniqueVersions}
            currentVersion={currentVersion}
            resolvedUrl={resolvedUrl}
            sequenceContext={sequenceContext}
            leftVersion={leftVersion}
            rightVersion={rightVersion}
            setLeftVersion={setLeftVersion}
            setRightVersion={setRightVersion}
            compareDisplayMode={compareDisplayMode}
            setCompareDisplayMode={setCompareDisplayMode}
            comparePosition={comparePosition}
            setComparePosition={setComparePosition}
            zoomPanBind={zoomPanBind}
            zoom={zoom}
            panOffset={panOffset}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            resetZoomPan={resetZoomPan}
          />
        )
      }`;
  lines.splice(imgStart +  1, imgEnd - imgStart, replacementImage);
  console.log('Replaced ImageCompareMode.');
} else {
  console.log('Could not find ImageCompareMode boundaries.');
}

// 2. Replace Video Compare Mode
let vidStart = lines.findIndex(l => l.includes('// VIDEO COMPARISON VIEW'));
let vidEnd = -1;
for (let i = vidStart + 1; i < lines.length; i++) {
  if (lines[i].includes('return (') && lines[i+1].includes('className="space-y-2 sm:space-y-3 w-full h-full flex flex-col"')) {
    vidEnd = i - 3; // The `      }` before `      return (`
    break;
  }
}

if (vidStart !== -1 && vidEnd !== -1) {
  const replacementVideo = `      // VIDEO COMPARISON VIEW
      if (videoComparison.isComparing && videoComparison.secondaryUrl) {
        return (
          <VideoCompareMode
            videoComparison={videoComparison}
            currentVersion={currentVersion}
            uniqueVersions={uniqueVersions}
            effectiveUrl={effectiveUrl}
            handleTimeUpdate={handleTimeUpdate}
          />
        )
      }`;
  lines.splice(vidStart, vidEnd - vidStart + 1, replacementVideo);
  console.log('Replaced VideoCompareMode.');
} else {
  console.log('Could not find VideoCompare boundaries.');
}

fs.writeFileSync(filePath, lines.join('\n'));
