module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
    },
    {
      name: 'auth',
      script: 'dist/apps/auth/main.js',
    },
    {
      name: 'email-worker',
      script: 'dist/apps/email-worker/main.js',
    },
    {
      name: 'user',
      script: 'dist/apps/user/main.js',
    },
    {
      name: 'wallet',
      script: 'dist/apps/wallet/main.js',
    },
    {
      name: 'neo4jdb-sync',
      script: 'dist/apps/neo4jdb-sync/main.js',
    },
    {
      name: 'relationship',
      script: 'dist/apps/relationship/main.js',
    },
  ],
};
