const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE'
const WEBHOOK_SECRET = 'PASTE_A_LONG_RANDOM_SECRET_HERE'
const SHEET_NAME = 'Redemptions'

function doPost(e) {
  try {
    const token = String(e?.parameter?.token || '')
    if (!WEBHOOK_SECRET || token !== WEBHOOK_SECRET) {
      return json_({ ok: false, reason: 'unauthorized' })
    }

    const payload = JSON.parse(e?.postData?.contents || '{}')
    if (!payload.redemptionId) {
      return json_({ ok: false, reason: 'missing_redemption_id' })
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME)
    ensureHeaders_(sheet)

    const values = [
      payload.redemptionId || '',
      payload.giftCodeLast4 || '',
      payload.name || '',
      payload.email || '',
      payload.phone || '',
      payload.address || '',
      payload.photoUrl || '',
      payload.upgradeKey || 'None',
      Number(payload.amountInr || 0),
      payload.paymentStatus || 'not_required',
      payload.createdAt || new Date().toISOString(),
    ]

    const row = findRedemptionRow_(sheet, payload.redemptionId)

    if (row) {
      sheet.getRange(row, 1, 1, values.length).setValues([values])
    } else {
      sheet.appendRow(values.concat(['New']))
    }

    return json_({ ok: true })
  } catch (error) {
    console.error(error)
    return json_({ ok: false, reason: 'server_error' })
  }
}

function ensureHeaders_(sheet) {
  const headers = [
    'Redemption ID',
    'Gift Code',
    'Name',
    'Email',
    'Phone',
    'Address',
    'Photo URL',
    'Upgrade',
    'Amount (INR)',
    'Payment Status',
    'Created At',
    'Fulfillment Status',
  ]

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers)
    sheet.setFrozenRows(1)
  }
}

function findRedemptionRow_(sheet, redemptionId) {
  if (sheet.getLastRow() < 2) return null

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === String(redemptionId)) return i + 2
  }
  return null
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON)
}
