export default () => ({
  apiGateway: {
    port: parseInt(process.env.API_GATEWAY_PORT || '4000', 10),
    host: process.env.API_GATEWAY_HOST
      ? process.env.API_GATEWAY_HOST.replace('http://', '').replace(
          'https://',
          '',
        )
      : '0.0.0.0',
  },
  environment: process.env.NODE_ENV || 'development',
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    },
    user: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    },
    email: {
      url: process.env.EMAIL_SERVICE_URL || 'http://localhost:4003',
    },
    relationship: {
      url: process.env.RELATIONSHIP_SERVICE_URL || 'http://localhost:4004',
    },
    wallet: {
      url: process.env.WALLET_SERVICE_URL || 'http://localhost:4005',
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
    },
  },
});
