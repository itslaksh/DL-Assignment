const http = require('http');
const https = require('https');

const PORT = 3000;

function getLatestStories(cb) {
    https.get('https://time.com/feed/', (resp) => {
        let xml = '';
        resp.on('data', (chunk) => (xml += chunk));
        resp.on('end', () => {
            try {
                const items = [];
                const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                let match;
                while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
                    const block = match[1];
                    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
                    const linkMatch = block.match(/<link>(.*?)<\/link>/);
                    if (titleMatch && linkMatch) {
                        items.push({
                            title: titleMatch[1].trim(),
                            link: linkMatch[1].trim(),
                        });
                    }
                }
                cb(null, items);
            } catch (e) {
                cb(e);
            }
        });
    }).on('error', (err) => {
        cb(err);
    });
}

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/getTimeStories') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        getLatestStories((err, stories) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to fetch stories' }));
                return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(stories));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`API available at http://localhost:${PORT}/getTimeStories`);
});
