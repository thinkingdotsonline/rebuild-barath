# HTTP API

All API responses are JSON except photo/document downloads. Errors are `{ "error": "..." }` with an appropriate 4xx/5xx status. Mutation requests must include `Content-Type: application/json` and `X-Rebuild-Request: 1`. Cross-origin mutations are rejected. Authentication uses an HttpOnly, SameSite cookie with an eight-hour lifetime; production adds Secure.

| Resource | Supported operations |
| --- | --- |
| `/api/health`, `/api/me` | Readiness, current account/permissions/company memberships |
| `/api/auth/register`, `/login`, `/logout`, `/password` | POST (all under `/api/auth/`) |
| `/api/categories` | GET public or `?admin=1` for admin; POST create/update by ID |
| `/api/assets` | GET public, `?scope=mine`, or permission-gated `?scope=admin`; POST draft create/update |
| `/api/assets/:id` | GET with visibility/company checks |
| `/api/assets/:id/status` | POST server-validated transition and reason |
| `/api/assets/:id/photos`, `/api/photos/:id` | Upload/list metadata; protected photo retrieval |
| `/api/favourites` | GET saved IDs; POST toggle `asset_id` |
| `/api/enquiries`, `/api/enquiries/:id` | GET scoped conversations; POST create/status |
| `/api/offers`, `/api/offers/:id` | POST create or counter; POST other-party acceptance/rejection |
| `/api/records?kind=inspection` | GET permission-scoped workflow records |
| `/api/records` | POST create/update typed operational record |
| `/api/certificates` | GET scoped records; POST issue approved public summary |
| `/api/certificates/:id`, `/:id/revoke` | Public GET status; permission-gated POST revocation |
| `/api/documents`, `/api/documents/:id` | Company-private metadata/upload; audited authorised download |
| `/api/data-room` | GET owned or actively shared mandates; POST attach/grant/revoke |
| `/api/users`, `/api/companies/verify` | Permission-gated identity/verification management |
| `/api/companies`, `/api/companies/members` | POST create company/add registered member |
| `/api/notifications`, `/api/dashboard` | Scoped in-app updates and current aggregate counts |
| `/api/settings`, `/api/audit` | Homepage copy; permission-gated immutable event history |
| `/api/features` | Read service availability; Super Admin POST launch switches |
| `/api/auctions` | GET visible auctions; manager POST schedule |
| `/api/auctions/:id/join` | POST participation request |
| `/api/auctions/:id/participants` | Manager GET/POST bidder reviews |
| `/api/auctions/:id/bid` | Approved-participant POST atomic bid |
| `/api/auctions/:id/close`, `/cancel` | Manager POST settlement result or cancellation |
| `/api/rentals` | GET offerings; operations POST create |
| `/api/rentals/:id/book`, `/api/bookings` | POST request; scoped GET or operations POST status |

Money is stored and submitted as integer paise, with INR currently supported. Browser forms accept rupees and convert to paise. IDs are UUIDs, with random public certificate identifiers. Company membership, assignments and explicit data-room grants scope private access; knowing an ID does not confer access.

Workflow kinds: `inspection`, `repair`, `logistics`, `business`, `lead`, `transaction`, `invoice`. All critical mutations write actor/time/history events. SQLite triggers prohibit audit event edits and deletes through application queries. This does not protect against an attacker with unrestricted filesystem/database control.
