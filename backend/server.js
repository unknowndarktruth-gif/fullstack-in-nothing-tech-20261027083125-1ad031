const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

const DB_FILE = path.join(__dirname, 'state_db.json');
let stateDb = { users: [], items: [], sessions: {}, submissions: [] };
if (fs.existsSync(DB_FILE)) {
    try { stateDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) {}
}
const saveDb = () => fs.writeFileSync(DB_FILE, JSON.stringify(stateDb, null, 2));
const capturedRoutes = [];

capturedRoutes.forEach(route => {
    if (!route.path || !route.path.startsWith('/')) return;
    const method = (route.method || 'GET').toLowerCase();
    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        app[method](route.path, (req, res) => {
            res.status(route.status || 200).set('Content-Type', route.content_type || 'application/json');
            if (typeof route.response_body === 'object') return res.json(route.response_body);
            return res.send(route.response_body || { status: 'ok' });
        });
    }
});

app.all('/api/*', (req, res) => {
    if (req.method === 'GET') return res.json({ success: true, path: req.path, data: stateDb.items });
    const entry = { id: Date.now(), path: req.path, method: req.method, payload: req.body };
    stateDb.items.push(entry);
    saveDb();
    return res.json({ success: true, data: entry });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
