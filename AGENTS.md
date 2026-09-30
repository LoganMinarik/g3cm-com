# AGENTS.md

Notes for AI agents and contributors. For project structure, deployment, and the
availability counter's Google setup, see `README.md` — that is the source of truth
and this file only adds what you cannot infer by reading the code.

## Build and deploy

No build step. Plain HTML, CSS, and vanilla JavaScript — no `package.json`, no
framework, no bundler, no CI, no linter, no tests. If you are about to run
`npm`, stop.

Hosting is Namecheap shared hosting; files are uploaded over FTP or cPanel.
**Pushing to Git does not deploy anything.** Live content is whatever was last
uploaded by hand. Commit before uploading so the live site matches a commit.

`rg` is not installed. Use `grep`.

## Verify with these

```sh
python3 -m http.server 8731          # from the repo root
node --check html/js/slots.js        # only JS file with real logic
```

For markup changes, check tag balance — every page is hand-written and unclosed
tags are the usual breakage. Do not add an HTML parser dependency to do it.

Git warns `LF will be replaced by CRLF the next time Git touches it`. That is
`core.autocrlf` and is harmless.

## The rule that matters: pricing lives in two places

These figures appear in prose in **both** `html/commissions.html` and
`html/legal.html`. Nothing enforces consistency, so **change them in the same
commit**. A figure updated in one file and not the other is the most likely way
this site ends up contradicting itself.

| Figure | Where |
| --- | --- |
| `$25.00` / hour | commissions: Pricing Summary, Payment Plan · legal: cl. 3.1, cl. 3.5 example |
| `$100.00` consultation | commissions: Pricing Summary, Payment Plan · legal: cl. 3.1, 3.3, 4 |
| `$50.00 / $50.00` split | commissions: Payment Plan · legal: cl. 3.3 |
| `$10.00` extra revision | commissions: Pricing Summary, Revision Fees · legal: cl. 5 |
| First `2` revisions free | commissions: Pricing Summary, Revision Fees · legal: cl. 5 ("two revisions") |
| `50 / 50` hours split | commissions: Payment Plan heading · legal: cl. 3.2 |

Search before editing: `grep -n '25\.00\|100\.00\|10\.00\|50 / 50\|two revisions' html/commissions.html html/legal.html`

The two files phrase the same rules differently, so a single grep can miss
matches. The revision count is `first 2` on the commissions page and
`two revisions` in legal.html; the hours split is a heading on one page and
prose in a numbered clause on the other. Match on the *figure*, not the wording.

## Wording that has been gotten wrong before

- **Never write "second 50%."** The 50/50 split describes the *estimated hours
  only*, which are always divided evenly. It does **not** mean the two payments
  are equal. The second payment is the "final payment" or "second payment."
- The `$100.00` consultation is a charge in **every** commission. Not a minimum,
  not optional.
- Additional hours require **written approval before the hours are worked** and
  bill to the **second** payment, never the deposit.
- Discounts are discretionary, agreed in writing before work, applied to the
  total *before* the split, itemized, and never retroactive.

## Editing legal.html

- Bump `Last updated:` at the bottom of the page. Privacy Policy §2 commits to
  keeping it current.
- Cross-references between Terms of Service clauses are **by section name**, not
  by link. Renumbering a clause silently breaks them — check every reference.
- A new anchor needs **two** things: an `id` on the heading, and a matching
  `scroll-margin-top` rule in the `<style>` block at the top of the file. See
  `#limitation-of-liability` and `#billing-process`.
- Keep the page balanced in tone: plain English, small-studio voice, no
  aggressive disclaimers or legal threats.

## Adding or editing a page

Three things are hand-copied into every page and drift apart if you forget: the
`#cookieBanner` block, the six-link nav panel (current page marked
`style="color:#58a6ff;"`), and the footer. Copy them from an existing page.

Path gotcha: `index.html` is at the repo root, everything else is one level down.
Home is `../index.html` from inside `html/`, but `html/legal.html` from the root.

## The availability counter

`html/js/slots.js` reads Booked/Total from a Google Sheet via an Apps Script
web app. Google Sheets and the script live in a Google account, **not in this
repository** — `README.md` holds the spreadsheet ID, the `/exec` URL, and the
full script source so it can be rebuilt.

- The endpoint is `ENDPOINT` at the top of `slots.js`. If you redeploy the
  script, the `/exec` URL does not change; update the README only if it does.
- **Do not narrow the web app's access from "Anyone".** That setting produces the
  `access-control-allow-origin: *` header the browser needs. Restricting it
  breaks the widget for every visitor, silently.
- Editing the script does nothing until you redeploy as a **new version**
  (Deploy → Manage deployments → pencil → New version → Deploy). This is the
  most common failure and the least obvious — a redeploy that reports success
  and changes nothing.
- When the sheet's tab or labels change, the script tolerates most layouts, but
  a `No "Booked" label...` error means nothing recognisable was found. Check the
  tab name first.