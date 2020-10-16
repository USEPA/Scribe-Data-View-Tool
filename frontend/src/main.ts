import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


if (environment.production) {
  enableProdMode();
}

/// <reference types="arcgis-js-api" />
import esriConfig from 'esri/config';

const DEFAULT_WORKER_URL = 'https://js.arcgis.com/4.17/';
const DEFAULT_LOADER_URL = `${DEFAULT_WORKER_URL}dojo/dojo-lite.js`;

esriConfig.workers.loaderUrl = DEFAULT_LOADER_URL;
esriConfig.workers.loaderConfig = {
  baseUrl: `${DEFAULT_WORKER_URL}dojo`,
  packages: [
    { name: 'esri', location: `${DEFAULT_WORKER_URL}esri` },
    { name: 'dojo', location: `${DEFAULT_WORKER_URL}dojo` },
    { name: 'moment', location: `${DEFAULT_WORKER_URL}moment` },
    { name: '@dojo', location: `${DEFAULT_WORKER_URL}@dojo` },
    {
      name: 'cldrjs',
      location: `${DEFAULT_WORKER_URL}cldrjs`,
      main: 'dist/cldr'
    },
    {
      name: 'globalize',
      location: `${DEFAULT_WORKER_URL}globalize`,
      main: 'dist/globalize'
    },
    {
      name: 'maquette',
      location: `${DEFAULT_WORKER_URL}maquette`,
      main: 'dist/maquette.umd'
    },
    {
      name: 'maquette-css-transitions',
      location: `${DEFAULT_WORKER_URL}maquette-css-transitions`,
      main: 'dist/maquette-css-transitions.umd'
    },
    {
      name: 'maquette-jsx',
      location: `${DEFAULT_WORKER_URL}maquette-jsx`,
      main: 'dist/maquette-jsx.umd'
    },
    { name: 'tslib', location: `${DEFAULT_WORKER_URL}tslib`, main: 'tslib' }
  ]
};

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
