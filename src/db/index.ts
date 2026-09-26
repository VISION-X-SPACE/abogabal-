/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create a new connection pool
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      connectionTimeoutMillis: 3000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', () => {
      // Handled silently by the resilient storage layer
    });
  }
  return global._postgresPool;
};

// Create a pool instance
export const pool = createPool();

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
