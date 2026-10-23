## What changed

## Security checklist
- [ ] New page or API? Who can reach it, and is that checked **on the server** (not only hidden in the menu)?
- [ ] Returns data? Only the fields the page needs (no password hashes, emails or internal IDs by accident)?
- [ ] Form or login that writes data? It has CSRF protection (`guardMutation` / `requireSameOrigin`) and rate limiting.
- [ ] New package? Maintained, and `npm audit` passes.
- [ ] Touches secrets, `.env`, Docker or server config? Nothing secret is committed; `.env.example` updated with blank values.
- [ ] New outside host (images, API, redirect)? Added to an allow-list, never a wildcard.
