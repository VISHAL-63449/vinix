export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send('google.com, pub-2526772201379380, DIRECT, f08c47fec0942fa0\n');
}

