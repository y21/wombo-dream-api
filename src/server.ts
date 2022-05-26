import polka from 'polka';
import http from 'http';
import * as WomboDream from './index';

const port = process.env.PORT || 3030;

console.log(`Listening on port ${port}`);

enum ErrorCode {
    MALFORMED_QUERY,
    TIMEOUT,
    RATELIMIT,
    TASK_FAIL
}

function reject(res: http.ServerResponse, error: ErrorCode) {
    res.writeHead(500, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ code: error }));
}

class TimeoutError extends Error { }

polka()
    .get('/generate', async (req, res) => {
        const { style, message } = req.query;

        if (Number.isNaN(style) || typeof message !== 'string') {
            return reject(res, ErrorCode.MALFORMED_QUERY);
        }

        try {
            const wombo = WomboDream.buildDefaultInstance();

            const task = wombo.generatePicture(message, Number(style));
            const timeout = new Promise((resolve, reject) => setTimeout(() => reject(new TimeoutError()), 20000));

            const result = await Promise.race([task, timeout]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (e) {
            console.log(e);

            if (e instanceof TimeoutError) {
                reject(res, ErrorCode.TIMEOUT);
            } else if (e instanceof WomboDream.WomboDream.TaskFailError) {
                reject(res, ErrorCode.TASK_FAIL);
            } else {
                reject(res, ErrorCode.RATELIMIT);
            }
        }
    })
    .listen(port);
