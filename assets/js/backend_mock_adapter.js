(function() {
    const CAPTURED_APIS = [];
    const STORAGE_KEY = '__fullstack_synthesized_db__';
    const loadDb = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { items: [], users: [] }; }
        catch (e) { return { items: [], users: [] }; }
    };
    const saveDb = (db) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) {}
    };
    const origFetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
        const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        const method = ((init && init.method) || 'GET').toUpperCase();
        try {
            const response = await origFetch(input, init);
            if (response.ok) return response;
        } catch (err) {}
        let parsedPath = urlStr;
        try { parsedPath = new URL(urlStr, location.origin).pathname; } catch (e) {}
        const matched = CAPTURED_APIS.find(r => r.path === parsedPath && (r.method || 'GET').toUpperCase() === method);
        if (matched && matched.response_body !== undefined) {
            const bodyStr = typeof matched.response_body === 'string' ? matched.response_body : JSON.stringify(matched.response_body);
            return new Response(bodyStr, { status: matched.status || 200, headers: { 'Content-Type': 'application/json' } });
        }
        const db = loadDb();
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            let bodyData = {};
            try { bodyData = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
            const newItem = { id: Date.now(), path: parsedPath, ...bodyData };
            db.items.push(newItem);
            saveDb(db);
            return new Response(JSON.stringify({ success: true, data: newItem }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, data: db.items }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
})();
