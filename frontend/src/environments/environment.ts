// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  oauth_url: 'http://localhost:8001/api/oauth2',
  login_redirect: 'http://localhost:4200',
  api_url: 'http://localhost:8001/api',
  api_version_tag: 'v1',
  default_baseloadedMap: '972c131daf9d4e83b30a98630c8f8b2b',
  agol_trusted_server: 'http://localhost:8001',
  agol_proxy_url_prefix: 'utility.arcgis.com',
  agol_proxy_url: 'http://localhost:8001/api/proxy/',
  geo_platform_url: 'https://epa.maps.arcgis.com',
  scribe_map_service: 'https://utility.arcgis.com/usrsvcs/servers/94cdbffe266c42e480b657b4bb42576d/rest/services/EPA_CERCLA/R9Scribe/MapServer'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
