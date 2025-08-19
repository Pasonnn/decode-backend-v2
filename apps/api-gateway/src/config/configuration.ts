export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    services: {
      auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      },
      email: {
        url: process.env.EMAIL_SERVICE_URL || 'http://localhost:3002',
      },
      relationship: {
        url: process.env.RELATIONSHIP_SERVICE_URL || 'http://localhost:3003',
      },
      user: {
        url: process.env.USER_SERVICE_URL || 'http://localhost:3004',
      },
      wallet: {
        url: process.env.WALLET_SERVICE_URL || 'http://localhost:3005',
      },
    },
  });