const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = process.env.LEMON_API_BASE_URL || 'http://localhost:5005';

async function ensureServerReachable() {
  try {
    const res = await request(BASE_URL).get('/api/platform');
    return res && res.status > 0;
  } catch (error) {
    return false;
  }
}

describe('Evolving API Integration (localhost runtime)', function () {
  this.timeout(15000);

  before(async function () {
    const reachable = await ensureServerReachable();
    if (!reachable) {
      this.skip();
    }
  });

  it('S1/S2 baseline: platform endpoint is callable from running docker app', async () => {
    const res = await request(BASE_URL).get('/api/platform');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('code');
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.be.an('array');
  });

  it('S3 baseline: knowledge list endpoint responds over HTTP API', async () => {
    const res = await request(BASE_URL).get('/api/knowledge');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('code');
    expect(res.body).to.have.property('data');
  });

  it('S4 baseline: conversation query endpoint accepts API request payload', async () => {
    const res = await request(BASE_URL)
      .post('/api/conversation/query')
      .send({ page: 1, page_size: 5 });

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('code');
    expect(res.body).to.have.property('data');
  });
});
