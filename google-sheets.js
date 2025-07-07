const { google } = require('googleapis');

const spreadsheetId = '1OTwKWXNhj1a0A74kKDz5jSjvaoSWyCESQIbGGDyRYfM';
const timezone = 'Asia/Jakarta';

// Autentikasi Google Sheets
const authenticate = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: "daniel136",
      private_key_id: "96b25ab3b1d870db38cd9d5d17ab93a38b423eee",
      private_key: process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrMnVriT5nJWyO\nTEP83ZZ320cPc+gjpCktB2m5C7nckfbvvPGd0qjY5hEXztB98rzfKNKZD3aFI0y4\nBwRo4w1IzFUSkymfrO1JL4UeOUe+nQv02BL7UyEXD7E4/fLGSEPRfbo3ScsCBMo2\noIXzvYGIZJfB5I0WXgIODtALXaerytL1ngOEDaurIsuSqdFJ8T40Te+20Tymrygu\nHt7ymAnxKuin9rcVN5AfVBhywVDX+ERMipTCdYT+YOZX5DOKYu+96vB7uyTvPKPd\n58EwtwPRGSqduu7EwVUJhIvuUQaveHppWEW7jTY1cO2603Yl1BefoNIt1dBb7LbF\n49qdOFE7AgMBAAECggEAEAxVXITLkEC+WeKFVw1wnwCzuxua7chkQb/ZpcqXHDmk\no9ma7rgCMv7yKECvY7cfBG5fu5BrBFUISpIB1FFAfAwHh4u7EahUwBEP0gL9mj0/\nky60LNIgnnhOnTCVEwhQLzGxhKBKwwAu8or+s5gWrfH8FeV2Ylvipm22C/K2FpDv\n64wyKeFT5sFmAdoZORu0Y/7NRQ9Eyhk4fOg8N03ktAu/WOW1YSt8KkQAQIHd6YIg\nfyKYsUe9k7DiHT1DZ7QwPAnfxnB2bWkxnRlf/8/Mor5rs7K8iHarFdv3nPjiTVH/\nYDp+q8SECiyiltYfvdI0D97nFOqtOK7OmtA70LmgwQKBgQDkK0VJQl/IpPgZwrhm\n36eXiwJ6t2T4ThJ3B+5RxBZ7h9agU3nTUfBlD/OsBg2bu3q36Szv3YOTxvTepR8Z\n5oMdpV2LnHfwymKirpk30sBEnDeBo2pVCHM+XjcbcbexSgRd1aAqHFaTkRh59EnC\nsPVOFyBZP2CApCckSlzeQs5QQQKBgQDAFDOx5ga8ic+ScfOpqWZnRddVFZGmvBP9\nYRS7SbZKGI3Kqv4Y1a5UTY/yj2h/EgeUi2gm86L2bZhAB/guf1NlKTHqSV2Lcq+q\ntQwcRF2x6XonZljXcMpeEdRY7MEIoazWVS2EeUPaTiTKjfuU/3zuEyO81yIR1/tF\n3frCuadCewKBgQDeoiYSDJS/h9CZ+jjKEFNL+BSsPwRjkHJN+MwetnGliW7vs2P8\nwUgKpJ0D7kga+70LdJcnWYJIkGpgUMffEuA+7hsv3bXemuvRhwHzyU1X5QH4Gcbo\nP72LTo0A114AvJM0J/0G+e20QXCblrTeJqLE1qX2z3NPMl0K+RBSwubiwQKBgCYB\nGUVetQCC5+4a29I68UcHu5ZbISlzVyUwGzD/YbEBcLSj5oi1ZrvJaOzeURerUpKi\njqX+WMUXZCNvMDzK9o4ye2zWvUqFE5rcHZxOLpewEXpQNs3RxEiekHxTw9HYY2E5\nEzt93t4HziHBvAB8GJTmdpC7pEMRj+cAB8iVgTGXAoGAPklvxGp56KQdxvEHRk+4\nQBX+g+Hw+tNVqzKVxPPCpOve/2ScOiVr/3PGWMNd2HeIzIWHVfZXWyETkwWiqmtL\n378u2pFNh6FaxZFbFObZjyPKYr/aWSd8fmy0v/NeNDz2+oL4n1D1DNVu6T2D2kQy\nSNW2o4UK3JmkBY25rIKqfC0=\n-----END PRIVATE KEY-----\n",
      client_email: "daniel166@daniel136.iam.gserviceaccount.com",
      client_id: "117950866995283381514",
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
};

// Membaca data dari sheet
const readData = async (authClient, sheetName) => {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    // Convert rows to objects
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        // Try to parse JSON for array/object fields
        try {
          obj[header] = JSON.parse(row[i]);
        } catch {
          obj[header] = row[i] || '';
        }
      });
      return obj;
    });
  } catch (err) {
    console.error('Error reading sheet:', err);
    throw err;
  }
};

// Menulis data ke sheet
const writeData = async (authClient, sheetName, data) => {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  try {
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Convert data to rows
    const values = [
      headers,
      ...data.map(item => 
        headers.map(header => {
          // Stringify arrays/objects
          if (Array.isArray(item[header]) {
            return JSON.stringify(item[header]);
          } else if (typeof item[header] === 'object' && item[header] !== null) {
            return JSON.stringify(item[header]);
          }
          return item[header] || '';
        })
      )
    ];
    
    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    
    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      resource: { values },
    });
  } catch (err) {
    console.error('Error writing to sheet:', err);
    throw err;
  }
};

module.exports = {
  authenticate,
  readData,
  writeData
};