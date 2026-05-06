const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const OS_APP_ID = 'c82dad6d-96bc-428d-a578-7bbcfce97a7f';
const OS_API_KEY = process.env.ONESIGNAL_KEY;

async function sendPush(filters, title, body) {
  try {
    await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: OS_APP_ID,
      filters: filters,
      headings: { en: title },
      contents: { en: body },
    }, {
      headers: {
        'Authorization': `Basic ${OS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Push sent:', title);
  } catch (e) {
    console.error('Push error:', e.message);
  }
}

console.log('PharmTrack server started...');

db.collection('pushJobs').​​​​​​​​​​​​​​​​
