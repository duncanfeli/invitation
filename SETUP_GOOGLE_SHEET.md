# Google Sheet RSVP Setup Guide

## Step-by-Step Instructions

### 1. Open Your Google Sheet
- Go to: https://docs.google.com/spreadsheets/d/1JqPUy2pH_dzizW8E4lgKPN1f4dbD2sXiCkWK0vHW3UI/edit?usp=sharing

### 2. Create Google Apps Script
- Click **Extensions** → **Apps Script**
- Delete any existing code in the editor
- Copy and paste the code from `GoogleAppsScript.gs` file
- Save the script (Ctrl+S)

### 3. Deploy the Script
1. Click the **Deploy** button (top right)
2. Select **New deployment** → **+**
3. Choose deployment type: **Web app**
4. Set "Execute as" to your email
5. Set "Who has access" to **Anyone**
6. Click **Deploy**
7. Copy the generated URL (it looks like: `https://script.google.com/macros/d/...../usercontent`)

### 4. Add the URL to Your HTML
- Open `index.html`
- Find the line: `fetch('YOUR_APPS_SCRIPT_URL', {`
- Replace `YOUR_APPS_SCRIPT_URL` with the deployed URL from step 3
- Save the file

### 5. Test It
- Open your wedding invitation in a browser
- Fill out the RSVP form
- Submit and check if it appears in your Google Sheet

## Note
- If you redeploy the script, you may get a new URL
- Make sure the Google Sheet is shared/accessible
- The script will create headers automatically on first submission

## Troubleshooting
- **CORS errors?** This shouldn't happen with Apps Script web apps, but if it does, ensure you deployed as "Anyone"
- **Data not appearing?** Check the Apps Script execution logs: Extensions → Apps Script → Executions
- **New URL after redeploy?** Update the `YOUR_APPS_SCRIPT_URL` in the HTML again
