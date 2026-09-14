# Google Sheets fulfillment export

This integration receives completed Tooned redemptions through a Google Apps Script web app and upserts them into a Google Sheet.

## 1. Create the fulfillment sheet

Create a new Google Sheet. The Apps Script will create a `Redemptions` tab automatically.

Copy the spreadsheet ID from the URL:

`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## 2. Create the Apps Script

Open the sheet's **Extensions → Apps Script**.

Replace the starter code with `Code.gs` from this folder.

Set these two constants at the top:

```js
const SPREADSHEET_ID = 'your-real-sheet-id'
const WEBHOOK_SECRET = 'a-long-random-secret'
```

Use the same secret in Vercel as `GOOGLE_SHEETS_WEBHOOK_SECRET`.

## 3. Deploy the script as a web app

In Apps Script:

1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the `/exec` URL.

Apps Script web apps support `doPost(e)` and expose POST request parameters through the event object. The endpoint is intentionally authenticated with the `token` query parameter. See Google's web-app documentation for the deployment model.

## 4. Add Vercel environment variables

In the `tooned-redemption-flow` Vercel project, add:

- `GOOGLE_SHEETS_WEBHOOK_URL` = your Apps Script `/exec` URL
- `GOOGLE_SHEETS_WEBHOOK_SECRET` = the same secret used in `Code.gs`

Redeploy after adding the variables.

## 5. Test

Complete a fresh redemption. The sheet should receive one row with:

- Redemption ID
- Gift code last 4
- Name
- Email
- Phone
- Address
- Photo URL
- Upgrade
- Amount
- Payment status
- Created at
- Fulfillment status (`New`)

If Stripe sends the webhook more than once, the Apps Script updates the existing row by Redemption ID rather than creating a duplicate.
