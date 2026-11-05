# Deployment

Nothing here runs automatically. Each step needs your Azure and Vercel accounts, and `infra/deploy.sh` asks for confirmation before creating anything.

## 1. Check the subscription

```bash
az login
az account show --query "{name:name, id:id}"
```

Employer or partner credits may not cover every resource type. Before relying on them, check the subscription's offer and its credit balance in the Azure portal under **Cost Management + Billing**, and confirm that Azure Functions and Storage are included.

Confirm that your region supports Flex Consumption:

```bash
az functionapp list-flexconsumption-locations --query "[].name" -o tsv
```

## 2. Create the Vercel project

Do this first: its URL is needed by Google and by the API's origin allowlist. Import the repository and set **Root Directory** to `apps/web`. Keep "Include files outside the root directory" enabled, because the app depends on `packages/shared`.

## 3. Create the Google OAuth client

In [Google Cloud Console](https://console.cloud.google.com/):

1. Create a project, for example `next-stop-asia`.
2. Under **Google Auth Platform → Branding**, fill in the app name and your support email. Choose the **External** audience.
3. Under **Audience**, publish the app. It only asks for name and email, so this doesn't need Google's verification. While it stays in "Testing", only listed test users can sign in.
4. Under **Clients**, create a client of type **Web application**.
5. Add `https://your-project.vercel.app` to **Authorized JavaScript origins**. Add any custom domain too. A redirect URI is not needed.

Copy the **Client ID**. It isn't secret, and no client secret is used.

## 4. Provision the backend

```bash
./infra/deploy.sh rg-next-stop-asia westeurope https://your-project.vercel.app \
  <google-client-id> <your-google-email>
```

This creates a storage account, one Function App on a Flex Consumption plan with no always-ready instances, and the role assignments for its managed identity. Keep the `GROUP_CREATION_SECRET` it prints, and note `functionAppName`. The last argument can list several admins, separated by commas.

Application Insights is off by default because ingestion can cost money. To enable it, add `enableMonitoring=true` to the parameters in `deploy.sh`.

Then publish the API:

```bash
./infra/publish-api.sh rg-next-stop-asia <functionAppName>
```

And create the voting group:

```bash
API_URL=https://<functionAppName>.azurewebsites.net \
GROUP_CREATION_SECRET='<secret from deploy.sh>' \
pnpm --filter @nsa/api create-group "Next Stop: Asia"
```

## 5. Finish Vercel

1. Edit `apps/web/vercel.json` and replace `REPLACE-WITH-FUNCTION-APP` with the Function App name.
2. Add these environment variables and deploy:

| Name | Value |
| --- | --- |
| `VITE_VOTING_MODE` | `api` |
| `VITE_GROUP_ID` | the group id |
| `VITE_GOOGLE_CLIENT_ID` | the client id from step 3 |
| `VITE_API_BASE_URL` | leave empty |

Without `VITE_VOTING_MODE=api` the site stays in the clearly labelled demo mode, where votes are not shared.

## 6. CORS and origins

The API implements CORS and the Origin check in code, so leave the Function App's platform CORS list empty. To change allowed origins:

```bash
az functionapp config appsettings set -g rg-next-stop-asia -n <functionAppName> \
  --settings ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-domain.example
```

Vercel preview URLs differ per deployment. Writes from them get a 403 unless you add that exact origin.

## 7. Smoke test

1. Open `/admin`, sign in with your Google account, and invite a second account.
2. Vote from each account on different devices, and confirm that both see the same totals and that the demo banner is gone.
3. Try an account that isn't invited, and confirm it's refused.
4. Lock and unlock the vote.

The site sends no invitation emails. After inviting people, send them the link yourself.

## Costs

The app is built to stay close to free for 5–30 friends:

- **Functions:** Flex Consumption's on-demand pricing includes a monthly grant per subscription of 250,000 executions and 100,000 GB-s ([pricing](https://azure.microsoft.com/pricing/details/functions/)). As a rough estimate, 30 people each spending 20 minutes on the vote section at one poll every 15 seconds make about 2,400 requests.
- **Storage:** billed separately from that grant. A few megabytes and thousands of table operations should come to cents per month ([pricing](https://azure.microsoft.com/pricing/details/storage/tables/)).
- **Vercel:** static hosting and rewrites. Check that your plan's terms fit this private, non-commercial use.
- **Maps:** OpenFreeMap has no key or billing; see its site for current terms.

These are estimates. Set a budget alert before sharing the link. In the portal, go to **Cost Management → Budgets → Add**, scope it to the resource group, set a small amount such as €5, and add alerts at 50% and 100%. Or, from the CLI:

```bash
az consumption budget create --budget-name nsa-budget --category cost --amount 5 \
  --time-grain monthly --resource-group rg-next-stop-asia \
  --start-date 2026-12-01 --end-date 2027-12-01
```

The CLI form creates the budget only. Add email alert recipients in the portal, because a budget without alerts notifies nobody.

To delete everything after the trip is decided:

```bash
az group delete --name rg-next-stop-asia
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Every write returns 403 | The site's origin is missing from `ALLOWED_ORIGINS`, including scheme and with no trailing slash |
| Sign-in works but the vote says the session expired | Cookie not stored: check that `/api` goes through the Vercel rewrite and `VITE_API_BASE_URL` is empty |
| API returns 500 with `internal` | Enable monitoring or read the log stream; check `STORAGE_TABLE_ENDPOINT` and the role assignments, which can take minutes to apply |
| API returns 404 on a group | `VITE_GROUP_ID` does not match the group that was created |
| The first request is slow | Cold start from zero instances, expected on this plan |
| Map stays blank | Check the CSP in `vercel.json` if you changed tile providers |
| Google button missing or `origin_mismatch` | The site's exact URL is missing from **Authorized JavaScript origins**; changes can take a few minutes |
| A friend is told they aren't invited | They signed in with a different account from the one you invited |
| Sign-in refused for everyone | `GOOGLE_CLIENT_ID` on the Function App differs from `VITE_GOOGLE_CLIENT_ID` |

## Local Azure-like runs

To exercise the Table repository with persistence, use Azurite:

```bash
pnpm --filter @nsa/api exec azurite-table --location .azurite
```

```bash
STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true pnpm dev:full
```

To run the real Functions host, install Azure Functions Core Tools, copy `apps/api/local.settings.json.example` to `local.settings.json`, build, and run `func start` in `apps/api`.
