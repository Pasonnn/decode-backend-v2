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
      url:
        process.env.AUTH_HOST && process.env.AUTH_PORT
          ? `http://${process.env.AUTH_HOST}:${process.env.AUTH_PORT}`
          : 'http://localhost:4001',
    },
    user: {
      url:
        process.env.USER_HOST && process.env.USER_PORT
          ? `http://${process.env.USER_HOST}:${process.env.USER_PORT}`
          : 'http://localhost:4002',
    },
    email: {
      url:
        process.env.EMAIL_HOST && process.env.EMAIL_PORT
          ? `http://${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`
          : 'http://localhost:4003',
    },
    relationship: {
      url:
        process.env.RELATIONSHIP_HOST && process.env.RELATIONSHIP_PORT
          ? `http://${process.env.RELATIONSHIP_HOST}:${process.env.RELATIONSHIP_PORT}`
          : 'http://localhost:4004',
    },
    wallet: {
      url:
        process.env.WALLET_HOST && process.env.WALLET_PORT
          ? `http://${process.env.WALLET_HOST}:${process.env.WALLET_PORT}`
          : 'http://localhost:4005',
    },
    notification: {
      url:
        process.env.NOTIFICATION_HOST && process.env.NOTIFICATION_PORT
          ? `http://${process.env.NOTIFICATION_HOST}:${process.env.NOTIFICATION_PORT}`
          : 'http://0.0.0.0:4006',
    },
  },
});
