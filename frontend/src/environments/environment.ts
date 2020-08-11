// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  agol_trusted_servers: ['http://127.0.0.1:8000'],
  agol_proxy_rules: {
    urlPrefix: 'services.arcgis.com/cJ9YHowT8TU7DUyn',
    proxyUrl: 'http://127.0.0.1:8000/proxy/'
  },
  oauth_url: 'https://epa.maps.arcgis.com/sharing/rest/oauth2/authorize',
  oauth_client_id: 'ZtlpDht9ywRCA4Iq',
  oauth_response_type: 'token',
  oauth_redirect_uri: 'http://localhost:4200/oauthcallback',
  local_client_id: 'ttDS2qFfDXJSxCjETxKHcWeFCjmiycrGPUrKRr8T',
  local_service_endpoint: 'http://localhost:4200/api',
  api_version_tag: 'v1',
  default_baseloadedMap: '972c131daf9d4e83b30a98630c8f8b2b',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
