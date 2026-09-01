# Google Sheet RSVP Setup Guide

The spreadsheet is the database. It uses **two tabs**: one you maintain by hand,
one the script writes to.

## Sheet Structure

### Tab 1 — `Guest List` (you maintain; the script only reads it)

Rows 1–3 hold settings; the guest table starts at row 4.

|   | A                  | B                                        | C   | D       | E          | F       | G    | H            |
|---|--------------------|------------------------------------------|-----|---------|------------|---------|------|--------------|
| 2 | BaseUrl            | `https://duncanfeli.github.io/invitation/` |   |         |            |         |      |              |
| 3 | Text Undangan WA   | *(WhatsApp message template)*            |     |         |            |         |      |              |
| 4 | **ID**             | **Nama**                                 | **Pax** | **Catatan** | **Sudah RSVP** | **Link WA** | **Link** | **No Telp** |
| 5 | INV001             | yussy                                    | 3   |         | sudah      | =…      | =…   | 081234567890 |
| 6 | INV002             | anong                                    | 2   |         | belum      | =…      | =…   |              |

- **ID** — matches the `?id=` in the invitation link
- **Nama** — replaces "Our Beloved Guest" throughout the page
- **Pax** — the maximum number of guests that invitation may RSVP for

The script does **not** assume the header row is row 1. It scans the first 20 rows
for the one carrying `ID`, `Nama` (or `Name`) and `Pax`, then reads the rows below
it. So you can move the table up or down, or add more settings rows above it,
without touching the code. What you must not do is rename those three headers.

#### Sharing formulas

`B2` holds the base URL, `B3` the WhatsApp template. Put these in row 5 and fill
down. They guard on **Nama** rather than ID, so rows where you have reserved an
ID but not yet filled in a name stay blank instead of generating a broken
"Dear ," message.

`E5` — has this guest replied yet:

```
=IF($A5="", "", IF(COUNTIF(RSVP!B:B, $A5)=0, "belum", "sudah"))
```

`F5` — ready-to-send WhatsApp message, addressed to the number in `H5`:

```
=IF($B5="", "",
  LET(
    tel, LET(d, REGEXREPLACE(TO_TEXT($H5), "[^0-9]", ""),
             IF(d="", "",
             IF(LEFT(d,1)="0",  "62" & MID(d,2,50),
             IF(LEFT(d,2)="62", d,
             IF(LEFT(d,1)="8",  "62" & d, d))))),
    msg, SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
           $B$3,
           "{nama}", $B5),
           "{pax}",  $C5),
           "{link}", $B$2 & "?id=" & $A5),
    "https://wa.me/" & tel & "?text=" & ENCODEURL(msg)
  ))
```

`H` (**No Telp**) accepts whatever format you paste — `081234567890`,
`+62 812-3456-7890`, `(0812) 3456-7890` all normalise to `6281234567890`.
A leading `0` becomes `62`, an existing `62` is left alone, and a bare `8…`
(what Sheets leaves behind when it treats the cell as a number and eats the
leading zero) also gets `62` prefixed.

Leave `H5` blank and the link falls back to `https://wa.me/?text=…`, which still
carries the message but asks you to pick the contact.

**Format column H as plain text** (Format → Number → Plain text) before typing
numbers, otherwise Sheets strips the leading `0` and may render long numbers in
scientific notation.

`G5` — plain clickable invitation link:

```
=IF($B5="", "", HYPERLINK($B$2 & "?id=" & $A5, "Buka undangan " & $B5))
```

The template in `B3` uses `{nama}`, `{pax}` and `{link}` as placeholders. Use
Option+Enter for line breaks inside the cell — they encode as `%0A` and WhatsApp
renders them as real newlines.

Do not wrap the `F5` formula in `ARRAYFORMULA`: `ENCODEURL` is not array-aware
and would encode only the first row, leaving every link below it wrong. To have
the column fill itself as you add guests, use `MAP` instead:

```
=MAP(A5:A, B5:B, C5:C, H5:H, LAMBDA(id, nama, pax, telp,
   IF(nama="", "",
     LET(d, REGEXREPLACE(TO_TEXT(telp), "[^0-9]", ""),
         tel, IF(d="", "", IF(LEFT(d,1)="0", "62" & MID(d,2,50),
                          IF(LEFT(d,2)="62", d,
                          IF(LEFT(d,1)="8", "62" & d, d)))),
       "https://wa.me/" & tel & "?text=" & ENCODEURL(
         SUBSTITUTE(SUBSTITUTE(SUBSTITUTE($B$3,"{nama}",nama),"{pax}",pax),"{link}",$B$2&"?id="&id))))))
```

#### Counting the RSVPs

`RSVP` is append-only, so a guest who submits twice has two rows. **Do not use
`=SUM(RSVP!D:D)`** — it double-counts revisions. Take each ID's *latest* answer
instead.

Add `Kehadiran` as a header in `I4` and fill this down from `I5`:

```
=IF($A5="", "", IFERROR(XLOOKUP($A5, RSVP!$B:$B, RSVP!$D:$D, "", 0, -1), ""))
```

The final `-1` searches the log bottom-up, so a re-submission wins over the
original. A blank result means that guest has not replied yet.

With column I in place, the summary counts are simple:

| Label                              | Formula                                            |
|------------------------------------|----------------------------------------------------|
| Total undangan                     | `=COUNTIF($A$5:$A, "<>")`                          |
| Sudah RSVP                         | `=COUNT($I$5:$I)`                                  |
| Belum RSVP                         | `=COUNTIF($A$5:$A,"<>") - COUNT($I$5:$I)`          |
| Konfirmasi hadir (undangan)        | `=COUNTIF($I$5:$I, ">0")`                          |
| Tidak hadir (undangan)             | `=COUNTIF($I$5:$I, 0)`                             |
| **Total tamu hadir** (headcount)   | `=SUM($I$5:$I)`                                    |
| Total pax dialokasikan             | `=SUM($C$5:$C)`                                    |

`COUNT` counts numbers only, so a `0` ("tidak hadir") is counted as a real answer
while an unanswered `""` is not.

For a single cell without the helper column:

```
=IFERROR(SUM(MAP(
   UNIQUE(FILTER(RSVP!$B$2:$B, RSVP!$B$2:$B<>"")),
   LAMBDA(id, XLOOKUP(id, RSVP!$B:$B, RSVP!$D:$D, 0, 0, -1)))), 0)
```

Once column I exists, `Sudah RSVP` in `E5` can read it directly instead of
querying the RSVP tab again:

```
=IF($A5="", "", IF($I5="", "belum", "sudah"))
```

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

The `Sudah RSVP` column on `Guest List` reads back from this tab — see the
sharing formulas above.

## Step-by-Step Instructions

### 1. Prepare the Google Sheet
- Go to: https://docs.google.com/spreadsheets/d/1JqPUy2pH_dzizW8E4lgKPN1f4dbD2sXiCkWK0vHW3UI/edit?usp=sharing
- Rename the first tab to **`Guest List`**
- Put the base URL in `B2` and the WhatsApp template in `B3`
- Put the headers `ID`, `Nama`, `Pax` on row 4 and your guests from row 5 down
- Leave the `RSVP` tab alone — it is created on the first submission

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
