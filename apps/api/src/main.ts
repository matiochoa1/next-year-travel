import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { loadConfig } from './config'
import type { ApiRequest } from './http'
import { createGoogleVerifier } from './identity'
import { execute, routes, type Deps } from './service'
import { createTableClient } from './storage'
import { TableRepository } from './table-repository'

let deps: Omit<Deps, 'log'> | undefined

// Built on first use so a misconfigured app reports a 500 instead of failing function indexing.
function getDeps() {
  if (!deps) {
    const config = loadConfig()
    deps = {
      config,
      repo: new TableRepository(createTableClient(config)),
      verifyIdentity: createGoogleVerifier(config.googleClientId),
      now: () => new Date(),
    }
  }
  return deps
}

for (const route of routes) {
  app.http(route.name, {
    route: route.path,
    methods: [route.method, 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
      try {
        const apiRequest: ApiRequest = {
          method: request.method,
          params: request.params,
          headers: request.headers,
          json: () => request.json(),
        }
        const log: Deps['log'] = (message, error) => context.error(message, error)
        const response = await execute(route, apiRequest, { ...getDeps(), log })
        return {
          status: response.status,
          headers: response.headers,
          ...(response.status === 204 ? {} : { jsonBody: response.body }),
        }
      } catch (error) {
        context.error('startup failure', error)
        return { status: 500, jsonBody: { error: 'internal' } }
      }
    },
  })
}
