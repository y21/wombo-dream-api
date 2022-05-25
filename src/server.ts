import polka from 'polka';
import http from 'http';
import * as WomboDream from './index';

const port = process.env.PORT || 3030;

console.log(`Listening on port ${port}`);

function reject(res: http.ServerResponse, status: number, message: string) {
    res.writeHead(status);
    res.end(message);
}

polka()
    .get('/generate', async (req, res) => {
        const { style, message } = req.query;

        if (Number.isNaN(style) || typeof message !== 'string') {
            return reject(res, 400, 'Malformed query parameters');
        }

        const wombo = WomboDream.buildDefaultInstance();
        try {
            const task = wombo.generatePicture(message, Number(style));
            const timeout = new Promise((resolve, reject) => setTimeout(reject, 20000, 'task timed out'));

            const result = await Promise.race([task, timeout]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (e) {
            console.log(e);
            return reject(res, 500, 'Failed to process wombo request');
        }
    })
    .listen(port);
