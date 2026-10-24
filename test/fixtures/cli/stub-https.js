// Preloaded with `node -r` by the CLI tests: https.get answers from the JSON
// file named in GOOSE_SKILLS_STUB_INDEX instead of the network.
const https = require('https');
const fs = require('fs');
const { PassThrough } = require('stream');

https.get = (url, opts, cb) => {
  const res = new PassThrough();
  const target = String(url);
  res.headers = {};
  res.statusCode = target.endsWith('/skills-index.json') ? 200 : 404;
  process.nextTick(() => {
    cb(res);
    res.end(res.statusCode === 200 ? fs.readFileSync(process.env.GOOSE_SKILLS_STUB_INDEX) : '');
  });
  return { on: () => {} };
};
