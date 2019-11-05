const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', proxy({
    target: 'http://localhost:8000',
    changeOrigin: true,
  }));
  app.use('/admin', proxy({
    target: 'http://localhost:8000',
    changeOrigin: true,
  }));
};
