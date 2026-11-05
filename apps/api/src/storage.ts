import { TableClient } from '@azure/data-tables'
import { ManagedIdentityCredential } from '@azure/identity'
import type { Config } from './config'

/**
 * Production uses the app's managed identity (no secret to rotate or leak). A connection string is
 * only meant for Azurite and local.settings.json.
 */
export function createTableClient(config: Config, env: NodeJS.ProcessEnv = process.env) {
  const connectionString = env.STORAGE_CONNECTION_STRING
  if (connectionString) {
    return TableClient.fromConnectionString(connectionString, config.tableName, {
      allowInsecureConnection: true,
    })
  }
  const endpoint = env.STORAGE_TABLE_ENDPOINT
  if (!endpoint) throw new Error('Set STORAGE_TABLE_ENDPOINT or STORAGE_CONNECTION_STRING')
  return new TableClient(endpoint, config.tableName, new ManagedIdentityCredential())
}
