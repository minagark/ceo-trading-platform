export const environment = {
  production: true,
  // CloudFront serves the app and forwards /api/* and /ws* to Beanstalk, so the API is same-origin
  apiBaseUrl: '/api',
};
