export const environment = {
  production: true,
  oauth_url: 'https://epa.maps.arcgis.com/sharing/rest/oauth2/authorize',
  oauth_client_id: 'JjhAJoIVvKhEe5FA',
  oauth_response_type: 'token',
  oauth_redirect_uri: 'https://r9.ercloud.org/scribeexplorer/oauthcallback',
  local_client_id: 'ttDS2qFfDXJSxCjETxKHcWeFCjmiycrGPUrKRr8T',
  local_service_endpoint: 'https://r9.ercloud.org/scribeexplorer/api',
  api_version_tag: 'v1',
  default_baseloadedMap: '972c131daf9d4e83b30a98630c8f8b2b',
};

export const globals = {
  samplePointSymbolColors: {
      air: ['#00b7ff', '#0062a8', '#00497c'],
      water: ['#6040ff', '#4c33cc', '#392699'],
      soil: ['#b59273', '#ffb339', '#6b2600']
  }
};
