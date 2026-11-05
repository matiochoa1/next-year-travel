#!/usr/bin/env bash
# Provisions the backend. This creates billable Azure resources, so it asks before doing anything.
#
#   ./infra/deploy.sh <resource-group> <location> <allowed-origins> <google-client-id> <admin-emails>
#   ./infra/deploy.sh rg-next-stop-asia westeurope https://next-stop-asia.vercel.app \
#     123.apps.googleusercontent.com you@gmail.com
set -euo pipefail

if [ $# -ne 5 ]; then
  echo "Usage: $0 <resource-group> <location> <allowed-origins> <google-client-id> <admin-emails>" >&2
  exit 1
fi

resource_group=$1
location=$2
allowed_origins=$3
google_client_id=$4
admin_emails=$5
subscription=$(az account show --query name -o tsv)

echo "Subscription:   $subscription"
echo "Resource group: $resource_group"
echo "Location:       $location"
echo "Allowed origin: $allowed_origins"
echo "Admin accounts: $admin_emails"
read -r -p "Create these Azure resources? Type 'deploy' to continue: " answer
[ "$answer" = "deploy" ] || { echo "Cancelled."; exit 1; }

group_secret=$(openssl rand -base64 32)
salt=$(openssl rand -base64 32)
session_secret=$(openssl rand -base64 32)

az group create --name "$resource_group" --location "$location" --output none
az deployment group create \
  --resource-group "$resource_group" \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters allowedOrigins="$allowed_origins" groupCreationSecret="$group_secret" rateLimitSalt="$salt" \
    sessionSecret="$session_secret" googleClientId="$google_client_id" adminEmails="$admin_emails" \
  --query properties.outputs --output json

echo
echo "GROUP_CREATION_SECRET (shown once, keep it in a password manager):"
echo "$group_secret"
