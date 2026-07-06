# RUNBOOK — move hornof.org to Cloudflare Pages

A numbered, do-this-then-check-that guide for taking `hornof.org` from its
current Dotster hosting to Cloudflare Pages, with no assumed Cloudflare
knowledge. **You run every step here — nothing in this file is automated.** Read
it once top to bottom before starting.

The plan is deliberately staged so the scary part (moving nameservers) changes
**nothing visible** on its own, and the actual content cutover is a separate,
instantly-reversible step.

---

## What you'll need

- Your **Dotster** login (registrar + current DNS host for hornof.org).
- Access to the **`hornof/hornof.org`** GitHub repo (you have it).
- About **30 minutes** of hands-on time, then up to **24 hours** of unattended
  propagation. Do this when a short wobble wouldn't matter (not before a big
  demo).
- A credit card for the Cloudflare account (the plan we use is **free** —
  card is just for signup/verification).

## Current state (snapshot, captured 2026-07-06)

Know what "normal" looks like now, so you can tell when something changed:

| Thing | Current value |
|---|---|
| Apex `hornof.org` → | `A 66.96.149.1` (Dotster hosting) |
| `www.hornof.org` → | `66.96.149.1` |
| Record TTL | `3600` (1 hour) |
| Nameservers | `ns1.dotster.com`, `ns2.dotster.com` |
| Registrar | Dotster |

Check any of these yourself from a terminal at any time:

```
dig +short hornof.org A          # → 66.96.149.1  (before cutover)
dig +short hornof.org NS         # → ns1/ns2.dotster.com  (before cutover)
```

---

## Part 1 — Stand up the new site on Cloudflare (no DNS impact yet)

Nothing in Part 1 touches hornof.org's live DNS. It's all safe.

### 1. Create a Cloudflare account

Go to <https://dash.cloudflare.com/sign-up>, sign up with your email, confirm the
verification email, and log in.

**Verify —** you land on the Cloudflare dashboard home and see an empty account
(no domains listed yet).

### 2. Create the Pages project from GitHub

In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
Authorize Cloudflare for the `hornof` GitHub account and pick the
**`hornof.org`** repo. On the build-settings screen enter exactly:

- **Production branch:** `main`
- **Framework preset:** `None`
- **Build command:** *(leave blank)*
- **Build output directory:** `/`

Click **Save and Deploy**.

**Verify —** the build log ends with **Success** and gives you a preview URL like
`https://hornof-org.pages.dev`. Open it: you should see the new one-pager (brown
serif "LUKE HORNOF" card), not the old site.

### 3. Check the archives serve on the preview URL

The archives live in dot-prefixed folders (`.2013 .2024 .2025`). Some static
hosts hide dot-folders. Test all three on the **preview** URL (swap in your real
`*.pages.dev` host):

```
https://hornof-org.pages.dev/.2013/
https://hornof-org.pages.dev/.2024/
https://hornof-org.pages.dev/.2025/
```

**Verify —** each loads an old-site snapshot (HTTP 200), not a 404.

- **If all three load:** nothing to do — skip to Part 2.
- **If any 404s:** Cloudflare is hiding the dot-folders. Apply the fallback in
  [Appendix A](#appendix-a--if-the-archives-dont-serve) now, let it redeploy,
  then re-run this step until all three load. Do **not** proceed to cutover with
  broken archives.

---

## Part 2 — Prepare DNS for a fast rollback

### 4. Lower the TTL at Dotster (do this ~24h before Part 3, if you can)

Log in to Dotster → **Domains → hornof.org → DNS / Advanced DNS** (label may
vary). For the `A` records on `@` (apex) and `www`, change **TTL** from `3600`
to **`300`** (5 minutes). Save.

Why: TTL is how long the rest of the internet caches an answer. Lowering it
first means that if you ever need to undo the content cutover (Part 5), the fix
takes ~5 minutes instead of an hour.

**Verify —** after a few minutes:

```
dig hornof.org A +noall +answer      # the number before "IN A" should read 300
```

### 5. Turn off DNSSEC at Dotster (only if it's on)

In Dotster, find **DNSSEC** for hornof.org (often under DNS or Security).
Changing nameservers with DNSSEC still enabled can make the domain
**unreachable**, so it must be off first.

**Verify —**

```
dig hornof.org DNSKEY +short         # no output = DNSSEC is off (good)
```

If it lists keys, disable DNSSEC in Dotster and re-check until this is empty.
(You can re-enable it later from Cloudflare once the domain is Active.)

---

## Part 3 — Move DNS to Cloudflare (still no visible change)

Here's the safe trick: Cloudflare will **import your existing records first**, so
when the nameservers flip, Cloudflare answers with the *same* `A 66.96.149.1` —
hornof.org keeps serving the **old** site, uninterrupted. The switch to the new
site is a separate step (Part 4).

### 6. Add hornof.org as a site in Cloudflare

Dashboard → **Add a site / domain** → type `hornof.org` → choose the **Free**
plan. Cloudflare scans your current DNS and shows what it found.

**Verify —** the imported records include `A  hornof.org  66.96.149.1` and a
record for `www`. If the apex `A` is missing, add it manually
(`Type A, Name @, IPv4 66.96.149.1`) so nothing drops when nameservers move.
Leave these as-is for now.

### 7. Copy your two assigned Cloudflare nameservers

Cloudflare shows **two** nameservers unique to your account, e.g.
`alice.ns.cloudflare.com` and `bob.ns.cloudflare.com` (yours will differ). Write
them down exactly.

**Verify —** you have two `*.ns.cloudflare.com` names recorded.

### 8. Point Dotster at Cloudflare's nameservers

In Dotster → **Domains → hornof.org → Nameservers** → choose "custom / use my own
nameservers" and **replace** `ns1.dotster.com` / `ns2.dotster.com` with the two
Cloudflare nameservers from Step 7. Save.

**Verify —** Dotster confirms the update. Then, over the next minutes-to-hours:

```
dig +short hornof.org NS             # eventually shows the two cloudflare names
```

Cloudflare also emails you and the domain shows **Active** on its Overview page.
This can take up to 24h but is often much faster.

### 9. Confirm the old site still works (no downtime)

Once the domain is **Active** on Cloudflare, open <https://hornof.org>.

**Verify —** you still see the **old** site, served now via Cloudflare's copy of
the imported `A` record. Nothing broke — that's the point. `dig +short
hornof.org A` still returns `66.96.149.1`.

---

## Part 4 — Cut over to the new site

### 10. Attach the domain to the Pages project

Go to **Workers & Pages → your `hornof.org` project → Custom domains → Set up a
custom domain**. Add **`hornof.org`**, then repeat for **`www.hornof.org`**.
Because the zone is already on Cloudflare, it wires up the DNS and TLS
automatically (it replaces the old `A 66.96.149.1` with the Pages target).

**Verify —** both custom domains show **Active** with a valid SSL certificate
(the certificate can take a few minutes to issue).

### 11. Verify the live cutover

Give it a couple of minutes (TTL is 300 now), then check the real domain:

- <https://hornof.org> → the **new** one-pager, over **https**, no cert warning.
- <https://www.hornof.org> → resolves to the same site.
- <https://hornof.org/.2013/>, `/.2024/`, `/.2025/` → each archive loads.

**Verify —** all of the above load correctly. From a terminal:

```
curl -sI https://hornof.org | head -1        # HTTP/2 200
```

### 12. Confirm auto-renew is ON at Dotster

The real way domains die is a lapsed **registration**, not a host move. Cutover
does **not** change your registrar — Dotster still owns the renewal.

In Dotster → **Domains → hornof.org → Auto-Renew / Renewal** → make sure
auto-renew is **ON** and the payment method on file is current. Note the
expiration date.

**Verify —** auto-renew shows enabled and the expiration date is in the future
with a valid card attached.

---

## Rollback

Everything is reversible. Pick the smallest fix for what went wrong.

**A. New site is broken, but DNS already moved to Cloudflare (fastest).**
In the Pages project → **Custom domains**, remove `hornof.org` (and `www`). Then
in Cloudflare **DNS**, re-add `A  @  66.96.149.1` (and `www → 66.96.149.1`),
proxy off. Because TTL is 300, hornof.org returns to the **old** site within
~5 minutes. This keeps you on Cloudflare DNS but back on the old content.

**B. Back out of Cloudflare entirely (nameservers).**
In Dotster → **Nameservers**, set them back to `ns1.dotster.com` and
`ns2.dotster.com`. Dotster's original DNS (with `A 66.96.149.1`) takes over
again. Nameserver changes can take up to 24h to fully propagate, which is why
option **A** is the fast path.

**Verify rollback —** `dig +short hornof.org A` returns `66.96.149.1` and
<https://hornof.org> shows the old site.

**Do not** cancel Dotster hosting or delete the old site for at least a week
after cutover — it's your rollback target. The archives and the old page at
`66.96.149.1` should stay put.

---

## Appendix A — if the archives don't serve

Only needed if Step 3 showed a 404 for any `/.YYYY/` path (Cloudflare hiding the
dot-folders). This copies the archives to dot-free folders **at deploy time**
(the on-disk `.2013/.2024/.2025` are never renamed) and rewrites the pretty URLs
onto them.

> Note: this adds a one-line deploy copy — a small exception to the repo's
> "no build step" rule, taken only if the host forces it. The `/.2013/` URLs
> stay the canonical, working paths.

1. In the Pages project → **Settings → Builds & deployments → Build command**,
   set:

   ```
   for d in .2013 .2024 .2025; do cp -r "$d" "${d#.}"; done
   ```

   (Leave the output directory as `/`.)

2. Add a file named **`_redirects`** at the repo root with:

   ```
   /.2013/* /2013/:splat 200
   /.2024/* /2024/:splat 200
   /.2025/* /2025/:splat 200
   ```

   The `200` makes these **rewrites**, not redirects: the browser URL stays
   `/.2013/…` while Cloudflare serves the copied `2013/…` files.

3. Commit `_redirects`, push to `main`, and let Pages redeploy.

**Verify —** re-run Step 3: `https://<project>.pages.dev/.2013/` (and `.2024`,
`.2025`) now load. Then continue the runbook.

---

## Sources

- [Cloudflare Pages — Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare DNS — Change your nameservers (Full setup)](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Cloudflare Fundamentals — Onboard a domain](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/)
- [Cloudflare Pages — Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
