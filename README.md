# g3cm.com

Static website for G3 C&M LLC. Plain HTML, CSS, and vanilla JavaScript — no build step, no framework, no bundler, no `package.json`. Push files, upload files, done.

## Layout

```
index.html              Home, served at the domain root
README.md               This file
html/
  charactersPage.html   Roster
  commissions.html      Availability, pricing, payment terms
  legal.html            Privacy Policy, Terms of Service, policies
  css/index.css         Single shared stylesheet
  js/index.js           Cookie banner, nav panel, carousel
  js/analytics.js       GA4, consent-gated
  js/slots.js           Availability table, fetches JSON from Apps Script
  images/               Webp and svg assets
```

## Deploying

Namecheap shared hosting. There is nothing to build.

1. Edit locally and preview with `python3 -m http.server` from the repo root.
2. Commit. Committing first means whatever is live always matches a commit.
3. Upload the repo contents to the Namecheap document root — over FTP (FileZilla) or cPanel → File Manager. **Everything except `.git/` goes up.**

Two things that bite people:

- `index.html` must land at the **root** of the document root, or the bare domain won't serve it.
- The document root is usually `public_html` on Namecheap shared hosting. Confirm yours under cPanel → **Domains**; if it differs, this is the one line to change in this README.

## Adding or editing a page

Three things are hand-copied into every page and will drift apart if you forget. When you add a page, copy them from an existing one:

1. **Cookie banner** — the `#cookieBanner` block at the top of `<body>`
2. **Nav panel** — six `.nav-link` entries, with the current page marked `style="color:#58a6ff;"`
3. **Footer** — copyright line and links

Path gotcha: `index.html` sits at the repo root while every other page is one directory down. Home is `../index.html` from inside `html/`, but `html/legal.html` from the root. The legal link in the cookie banner is `html/legal.html` on `index.html` and `legal.html` on the other three.

## Figures that must stay in sync

These appear in prose in more than one file. **Change them in the same commit.**

| Figure | Commissions page | Legal page |
| --- | --- | --- |
| `$25.00` / hour | Pricing Summary, Payment Plan | Billing Process cl. 3.1 and the 3.5 example |
| `$100.00` consultation | Pricing Summary, Payment Plan | Billing Process cl. 3.1, 3.3, 4 |
| `$50.00 / $50.00` split | Payment Plan | Billing Process cl. 3.3 |
| `$10.00` per extra revision | Pricing Summary, Revision Fees | Billing Process cl. 5 |
| First `2` revisions free | Pricing Summary, Revision Fees | Billing Process cl. 5 (as "two revisions") |
| `50 / 50` hours split | Payment Plan heading | Billing Process cl. 3.2 |
| `$600.00` / 20-hour example | Payment Plan example | Billing Process cl. 3.5 |

The rules the wording encodes — these have been gotten wrong before, so check them if you edit either file:

- The `$100.00` consultation is a charge in **every** commission. It is not a minimum, and not optional.
- **"50/50" describes the estimated hours only**, which are always divided evenly. It does not mean the two payments are equal. The consultation is placed either `$50.00 / $50.00` or paid in full up front, agreed at the estimate stage, recorded in the signed contract, shown on the first invoice, and fixed once chosen.
- Additional hours must be approved **in writing before the hours are worked**, and are billed on the **second** payment, never the deposit. Never write "second 50%."
- Discounts are discretionary, agreed in writing before work starts, applied to the total *before* the split, itemized on their own invoice line, and never retroactive to work already invoiced.

## Commission availability counter

The Commissions page shows Booked / Total / Open counts read from a Google Sheet. The chain is:

```
Google Sheet  ->  Apps Script web app (returns JSON)  ->  html/js/slots.js  ->  styled table
```

The site cannot read a Sheet directly — Google sends no CORS headers on published sheets, which is why the Apps Script hop is mandatory and why the earlier `<iframe>` approach was abandoned.

To change the numbers: edit the sheet, save, refresh the page. No code change, no commit, no upload.

### Identifiers

These are recorded here because the script lives in a Google account and the sheet is not public — this README is the only place they exist. Losing them means losing the widget until a new deployment is made.

| What | Value |
| --- | --- |
| Spreadsheet | `1mGIgukOIeJK8DFiE7CrMiX8DV6_czT5ZWfs0eqAMceM` |
| Sheet title | `Comms G3 C&M LLC` |
| Tab | `Slots` |
| Apps Script `/exec` URL | `https://script.google.com/macros/s/AKfycbwim3sZ8PPly_GTGcdwATRCF8PDs5jifjwSmBpASdC2GstoAgYbAofz4W6yJyBtDN6pfA/exec` |

The same `/exec` URL is pasted at the top of `html/js/slots.js` as `ENDPOINT`. If the two ever disagree, the code wins — re-check the value above against it.

**Known state as of September 30 2026:** the sheet reads `filled: 0`, `total: 1`, so the public page shows Booked 0 / Total 1 / Open 1. Check this line against the live response before assuming a figure is a bug.

### The sheet layout

The script scans the sheet's whole used range for a label cell, then reads the number **immediately to its right, or immediately below it**. So all of these work:

| Layout | Example |
| --- | --- |
| Label, then number beside it | `Booked` \| `2` |
| Label above number | `Booked` on row 1, `2` on row 2 |
| Transposed with a header row | `Slots` \| `Booked` \| `Open` |
| Any column | The pair can sit anywhere |

Recognised labels, matched case-insensitively: `Booked` / `Filled` / `Taken`, and `Total` / `Slots` / `Capacity`. `Open` is derived by the front end (`Total - Booked`) — do not put it in the sheet.

The tab is looked up as `Slots`, but if that tab is missing the script falls back to the first sheet, so the tab name is a preference rather than a requirement. This was never directly confirmed by reading the sheet — it was inferred from an earlier deployment that resolved a tab by that name. If the layout above stops working, check the tab name first.

### The script

Lives in your Google account, not in this repository — this section is the only record of it. Open the sheet, then **Extensions → Apps Script**, and replace the contents:

```javascript
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Slots') || ss.getSheets()[0];
  if (!sheet) throw new Error('No sheet found in this spreadsheet');

  var values = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).getValues();

  var filled = null;
  var total = null;

  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      var label = String(values[r][c]).trim().toLowerCase();
      var isFilled = (label === 'booked' || label === 'filled' || label === 'taken');
      var isTotal = (label === 'total' || label === 'slots' || label === 'capacity');
      if (!isFilled && !isTotal) continue;

      var value = null;

      if (c + 1 < values[r].length && values[r][c + 1] !== '') {
        var right = Number(values[r][c + 1]);
        if (!isNaN(right)) value = right;
      }

      if (value === null && r + 1 < values.length && values[r + 1][c] !== '') {
        var below = Number(values[r + 1][c]);
        if (!isNaN(below)) value = below;
      }

      if (value === null) continue;
      if (isTotal) total = value;
      else filled = value;
    }
  }

  if (filled === null) throw new Error('No "Booked" label with a number beside or below it');
  if (total === null) throw new Error('No "Total" label with a number beside or below it');

  return ContentService.createTextOutput(JSON.stringify({
    filled: filled,
    total: total,
    updated: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

Deploy: **Deploy → New deployment → gear → Web app.** Then *Execute as: Me* and *Who has access: Anyone*. Copy the **Web app URL**, which ends in `/exec`, and paste it over `ENDPOINT` at the top of `html/js/slots.js`. Until that is done the widget deliberately shows dashes.

### Traps

These are all things that break it silently:

- **`/exec`, never `/dev`.** The `/dev` URL only works while you are logged in. Visitors get nothing.
- **"Anyone", not "Anyone with Google account."** The latter demands a sign-in and the fetch fails.
- **No path after `/exec`.** Adding anything redirects to a Google login page.
- **Editing the script does nothing** until you go to **Deploy → Manage deployments → pencil icon → New version → Deploy.** The old URL keeps serving the old code. This is the most common failure and the least obvious — a redeploy that looks successful and changes nothing.
- **Any fatal error** in the script surfaces as a blank widget, not as an error message.

### The sheet does not need to be published

The script reads the sheet with your own permissions, so the sheet does **not** need to be published to the web. This project did publish one earlier, embedding a `pubhtml` URL in the page. That approach was abandoned and the link has since been revoked — it now returns Google's sign-in page rather than the sheet. If you ever find a published link for this spreadsheet, revoke it with **File → Share → Publish to web → Stop publishing**.

Whether published or not, do not put client names, emails, handles, invoices, or prices in this sheet. A published sheet exposes every tab, not just the one being read.

Note that the web app itself must stay deployed as *Anyone*, because that is what produces the `access-control-allow-origin: *` header the browser needs. Anyone holding the `/exec` URL can read the two counts. Keep that URL out of public discussion; it is already in page source, which is unavoidable and fine for two integers.

### When it shows dashes

The table shows `—` and "email us" when the fetch fails and there is no cached copy. Open the `/exec` URL directly in a browser to diagnose: it will show either the JSON payload or the underlying script error. A `No "Booked" label...` error means the sheet has no recognisable label next to a number.

Caching means a page loaded within five minutes of a successful fetch reuses the stored value without hitting Google.

## Analytics

- GA4 measurement ID: `G-R2RTVB22T3` (in `html/js/analytics.js`)
- Consent lives in `localStorage` under the key `cookieConsent`. Until a visitor accepts, `analytics_storage` is denied and no events fire.

## Legal copy checklist

When editing `html/legal.html`:

- Bump `Last updated:` at the bottom of the page (currently "September 2026"). Section 2 of the Privacy Policy commits you to keeping it current.
- Keep clauses numbered in order — the Terms of Service cross-reference each other **by section name**, not by link, so check every cross-reference still points where you think it does.
- A new anchor needs two things: an `id` on the heading, and a matching `scroll-margin-top` rule in the `<style>` block at the top of the file. See `#limitation-of-liability` and `#billing-process` for the pattern.
- Re-check the figures table above before committing.

## Git

Git may warn `LF will be replaced by CRLF the next time Git touches it`. That is `core.autocrlf` behaving normally on Windows-authored files and is harmless for HTML.