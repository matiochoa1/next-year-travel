# Security notes

## Who can get in

Sign-in is invite-only with Google. An account must be on the group's invitation list, or in `ADMIN_EMAILS`, to get a session.

What is enforced on the server:

- The Google ID token's signature, issuer, audience, expiry and verified email are all checked.
- One participant per Google account, identified by Google's stable subject id rather than the email. One active vote per participant, by table key, with ETag-guarded updates.
- Votes, results, names and comments need a session. Totals are computed from stored votes on every read, and the client never submits them.
- Removing an invitation deletes the person's participant row and vote, and their sessions stop working on the next request.
- Admin rights come only from `ADMIN_EMAILS`, checked on every request.

Someone with several Google accounts can only vote with the ones you invited. Gmail addresses are matched ignoring dots and `+tags`.

**The site itself isn't private.** Vercel serves it as static files, so the destination guides, itineraries and budgets are public to anyone with the URL. The login protects group data, not this content. Pages are marked `noindex`, which asks search engines not to list them.

## Shared prices

Any signed-in participant can edit or reset a budget price for the whole group, because friends are trusted and the goal is low friction. The API records who made the latest change, from the session rather than the request. There's no history, so an overwritten value can't be restored. Edits use ETags, so a stale edit is refused rather than silently overwriting a friend's.

## Personal data

The table stores each invited email, plus each participant's Google display name, email and last login. Email addresses are visible only on the admin page. Raw Google tokens are never stored. Deleting the resource group deletes all of it.

## Credentials

| Credential | Where it lives | Notes |
| --- | --- | --- |
| Session | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` cookie | HMAC-signed, expires after 60 days |
| `SESSION_SECRET` | App setting | Changing it signs everyone out |
| Group creation secret | App setting | Used only by the CLI |
| Google client id | Public | Identifies the app; no client secret is used |
| Storage access | Managed identity, with shared keys disabled on the account | Nothing to store |

The repository is public, so never commit `.env` files, `local.settings.json` or real admin emails. The account key in `table-repository.test.ts` is Azurite's published development key. The `dev|email|name` credential works only in `dev-server.ts`, which is never deployed.

## Request protections

- **CSRF:** writes require the `X-NSA-Client` header, and any `Origin` must be allowlisted. A foreign page can do neither without passing CORS preflight, which is limited to the allowlist.
- **Validation:** Zod strict schemas reject unknown fields and limit comments to 280 characters. Control characters are stripped, including from Google display names.
- **Output:** user text is rendered by React as text nodes, never as HTML.
- **Errors:** clients receive only a short code, and details go to the server log.
- **Rate limits:** fixed-window counters in Table Storage per action and client, using a salted hash rather than the raw address. If the limiter's storage fails it lets requests through and logs it, because a private poll values availability over strict limits.

## Known limits

- The rate limiter trusts the first `X-Forwarded-For` entry. Calling the Function App directly, rather than through Vercel, lets a client spoof that value and evade per-address limits. Other protections are unaffected.
- A vote racing an admin lock by milliseconds may be accepted. This has no practical effect on a friends' poll.
- Rate-limit rows are not cleaned up. They are tiny, and the resource group is meant to be deleted after the vote.
- A session keeps working for up to 60 days, unless the person is removed or signs out on that device.
