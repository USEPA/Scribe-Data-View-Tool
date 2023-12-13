/// <reference lib="webworker" />

import {Feature, FeatureCollection} from '../projectInterfaceTypes';

addEventListener('message', ({data}) => {
  // Generate the geojson from the frontend
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: []
  };
  data.rows.forEach(row => {
    const feature: Feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: []
      },
      properties: {}
    };
    feature.geometry.coordinates = [row.Longitude, row.Latitude];
    feature.properties = row;
    featureCollection.features.push(feature);
  });

  const response = featureCollection.features.length ? JSON.stringify(featureCollection) : '';

  postMessage(response);
});
