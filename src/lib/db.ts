import 'server-only'

/**
 * Re-export database clients from the db directory
 * This file provides backward compatibility for imports from '@/lib/db'
 */
export * from './db/index';
