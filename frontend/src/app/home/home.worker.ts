/// <reference lib="webworker" />


import {getMissingGeoPoints, mergeAllSamplesAndLabResults} from './home.functions';

addEventListener('message', ({ data }) => {
  let results;
  if (data.method === 'mergeAllSamplesAndLabResults') {
    results = mergeAllSamplesAndLabResults(data.samplePoints, data.labResults);
  } else if (data.method === 'getMissingGeoPoints') {
    results = getMissingGeoPoints(data.samplePoints, data.labResults);
  }
  postMessage(results);
});

