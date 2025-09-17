import { registerAs } from '@nestjs/config';

export default registerAs('neo4jdb-sync', () => ({
  uri: process.env.NEO4J_URI,
  user: process.env.NEO4J_USER,
  password: process.env.NEO4J_PASSWORD,
}));
