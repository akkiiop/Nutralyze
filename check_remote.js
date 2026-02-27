const check = async (url) => {
    console.log(`Checking: ${url}`);
    try {
        const res = await fetch(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://nutralyze.onrender.com',
                'Access-Control-Request-Method': 'POST'
            }
        });
        console.log(`Status: ${res.status}`);
        console.log(`CORS Header (Allow-Origin): ${res.headers.get('access-control-allow-origin')}`);

        const healthRes = await fetch(url.replace('/harmful-ingredients', '/health'));
        const body = await healthRes.json().catch(() => 'NOT_JSON');
        console.log(`Health:`, body);
        console.log('---');
    } catch (err) {
        console.log(`Error: ${err.message}`);
        console.log('---');
    }
};

const run = async () => {
    await check('https://nutrivision-oc9q.onrender.com/api/harmful-ingredients');
    await check('https://nutralyze.onrender.com/api/harmful-ingredients');
    await check('https://nutrivision-ai.onrender.com/api/harmful-ingredients');
};

run();
