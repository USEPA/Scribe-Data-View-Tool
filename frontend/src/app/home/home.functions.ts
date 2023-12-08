export function mergeAllSamplesAndLabResults(samplePoints, labResults) {
  const rowDataMerged = [];
  labResults.forEach(result => {
    rowDataMerged.push({
      ...result, ...(samplePoints.find((point) =>
        point.Samp_No === result.Samp_No))
    });
  });
  return rowDataMerged;
}

export function getMissingGeoPoints(samplePoints, labResults) {
  let missingGeoPointsCount = 0;
  labResults.forEach(result => {
    const found = samplePoints.find((point) => {
      if (point.Samp_No === result.Samp_No) {
        return point;
      }
    });
    if (found) {
      if (!found.Latitude || !found.Longitude) {
        missingGeoPointsCount = missingGeoPointsCount + 1;
      }
    }
  });
  return missingGeoPointsCount;
}
