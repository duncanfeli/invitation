# Google Sheet RSVP Setup Guide

The spreadsheet is the database. It uses **two tabs**: one you maintain by hand,
one the script writes to.

## Sheet Structure

### Tab 1 — `Guest List` (you maintain; the script only reads it)

| ID     | Nama                 | Pax |
|--------|----------------------|-----|
| INV001 | Bpk. Andi & Keluarga | 4   |
| INV002 | Sarah & Partner      | 2   |

- **ID** — matches the `?id=` in the invitation link, e.g. `.../invitation/?id=INV001`
- **Nama** — replaces "Our Beloved Guest" throughout the page
- **Pax** — the maximum number of guests that invitation may RSVP for

The header row must contain `ID`, `Nama` (or `Name`) and `Pax`. Capitalisation
and column order do not matter.

### Tab 2 — `RSVP` (the script appends here; created automatically)

| Waktu               | ID     | Nama                 | Kehadiran | Ucapan      |
|---------------------|--------|----------------------|-----------|-------------|
| 01/09/2026 14:22:03 | INV001 | Bpk. Andi & Keluarga | 3         | Selamat ya! |
| 01/09/2026 15:10:41 | INV002 | Sarah & Partner      | 0         | Maaf tdk bs |

- **Kehadiran** — the *Jumlah Tamu* the guest selected. "Tidak Hadir" is recorded
  as `0`, so you can `=SUM()` the column for a total headcount.
- **Ucapan** — the text from the *Ucapan & Doa* field.
- **Nama** is re-read from `Guest List` server-side, not taken from the browser.
- `Kehadiran` is capped at that invitation's `Pax`, so a 2-pax guest cannot submit 8.

To see who has not replied yet, put this in a spare column of `Guest List` (row 2,
then fill down):

```
=IF(COUNTIF(RSVP!B:B, A2)=0, "belum", "sudah")
```

## Step-by-Step Instructions

### 1. Prepare the Google Sheet
- Go to: https://docs.google.com/spreadsheets/d/1JqPUy2pH_dzizW8E4lgKPN1f4dbD2sXiCkWK0vHW3UI/edit?usp=sharing
- Rename the first tab to **`Guest List`** and add the headers `ID`, `Nama`, `Pax`
- Fill in your guest list. Leave the `RSVP` tab alone — it is created on the first submission.

### 2. Install the Apps Script
- Click **Extensions** → **Apps Script**
- Delete any existing code in the editor
- Copy and paste the code from `GoogleAppsScript.gs`
- Save the script (Ctrl+S)

### 3. Deploy the Script
1. Click **Deploy** → **New deployment**
2. Choose deployment type: **Web app**
3. Set "Execute as" to **Me** (your email)
4. Set "Who has access" to **Anyone**
5. Click **Deploy**, authorise when prompted
6. Copy the `/exec` URL

### 4. Add the URL to Your HTML
- Open `index.html`, find `const APPS_SCRIPT_URL = '...'`
- Replace it with the URL from step 3, and save

### 5. Test It
- Open the invitation with a real ID: `index.html?id=INV001`
- The guest's `Nama` should replace "Our Beloved Guest", and *Jumlah Tamu*
  should list `1 Orang` … up to their `Pax`
- Submit, then check that a row appeared on the `RSVP` tab
- Also try an unknown ID (`?id=INV999`) — the page should still load with defaults

## Redeploying — Important
When you change the script, use **Deploy → Manage deployments → edit (pencil) →
Version: New version**. Choosing "New deployment" instead issues a **new URL**
and breaks the `APPS_SCRIPT_URL` already in `index.html`.

## Troubleshooting
- **Nothing written / CORS error?** The page posts as `text/plain;charset=utf-8`
  on purpose. `application/json` triggers a CORS preflight that Apps Script does
  not answer, so the request fails silently. Do not change it back.
- **"Invitation not found"?** The `?id=` does not match any `ID` in `Guest List`.
- **Empty Jumlah Tamu dropdown?** The guest was not found, so `Pax` fell back to 1.
- **Other data problems?** Check the execution logs: Apps Script → **Executions**.
