// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  oauth_url: 'http://localhost:8000/api/oauth2',
  oauth_client_id: 'ZtlpDht9ywRCA4Iq',
  login_redirect: 'http://localhost:4200',
  local_client_id: 'ttDS2qFfDXJSxCjETxKHcWeFCjmiycrGPUrKRr8T',
  api_url: 'http://localhost:8000/api',
  api_version_tag: 'v1',
  default_baseloadedMap: '972c131daf9d4e83b30a98630c8f8b2b',
  agol_trusted_server: 'http://localhost:8000',
  agol_proxy_url_prefix: 'utility.arcgis.com',
  agol_proxy_url: 'http://localhost:8000/api/proxy/',
  geo_platform_url: 'https://epa.maps.arcgis.com',
  user_geo_platform_url: 'https://innovate.maps.arcgis.com'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
