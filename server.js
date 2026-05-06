const admin = require('firebase-admin');
const https = require('https');
const http = require('http');

// Keep Render happy with a web server
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('PharmTrack Server Running');
}).listen(process.env.PORT || 3000);

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const OS_APP_ID = 'c82dad6d-96bc-428d-a578-7bbcfce97a7f';
const OS_KEY = process.env.ONESIGNAL_KEY;

function sendPush(filters, title, body) {
  const data = JSON.stringify({
    app_id: OS_APP_ID,
    filters: filters,
    headings: { en: title },
    contents: { en: body }
  });
  const options = {
    hostname: 'onesignal.com',
    path: '/api/v1/notifications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + OS_KEY
    }
  };
  const req = https.request(options, (res) => {
    let b = '';
    res.on('data', (c) => b += c);
    res.on('end', () => console.log('Push sent:', title, b));
  });
  req.on('error', (e) => console.error('Push error:', e.message));
  req.write(data);
  req.end();
}

console.log('PharmTrack server started...');

db.collection('pushJobs').orderBy('ts','desc').limit(50).onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type !== 'added') return;
    const job = change.doc.data();
    const ts = job.ts && job.ts.toDate ? job.ts.toDate() : new Date(0);
    if ((new Date() - ts) > 30000) return;
    await change.doc.ref.update({ delivered: true }).catch(() => {});
    let filters = [];
    if (job.targetBadge) {
      filters = [{ field:'tag', key:'badge', relation:'=', value:String(job.targetBadge) }];
    } else if (job.targetRole) {
      filters = [
        { field:'tag', key:'role', relation:'=', value:job.targetRole },
        { operator:'OR' },
        { field:'tag', key:'role', relation:'=', value:'mg' }
      ];
    }
    if (filters.length > 0) sendPush(filters, job.title, job.body);
  });
});

setInterval(() => console.log('alive:', new Date().toISOString()), 60000);
