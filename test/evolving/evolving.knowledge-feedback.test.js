const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');

require('module-alias/register');

const FileStorage = require('@src/knowledge/FileStorage');

function makeStorage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lemonai-evolving-knowledge-'));
  return { storage: new FileStorage(dir), dir };
}

describe('Evolving :: long-term knowledge storage operations', () => {
  it('supports ADD via save and read (S3)', async () => {
    const { storage } = makeStorage();

    const created = await storage.save({
      category: 'execution',
      content: '코드 예시는 TypeScript를 우선 사용한다.',
      importance: 2,
      metadata: { source: 'user_feedback' },
    });

    const loaded = await storage.get(created.id);

    expect(loaded).to.not.equal(null);
    expect(loaded.content).to.include('TypeScript');
    expect(loaded.category).to.equal('execution');
  });

  it('supports MODIFY via update (S3)', async () => {
    const { storage } = makeStorage();

    const created = await storage.save({
      category: 'planning',
      content: '답변은 짧게 작성한다.',
      importance: 1,
      metadata: { source: 'legacy_feedback' },
    });

    const updated = await storage.update(created.id, {
      content: '답변은 상황에 따라 자세히 작성한다.',
      metadata: { source: 'new_feedback' },
    });

    expect(updated.content).to.include('자세히');
    expect(updated.metadata.source).to.equal('new_feedback');
  });

  it('supports DELETE via remove (S3)', async () => {
    const { storage } = makeStorage();

    const created = await storage.save({
      category: 'planning',
      content: '항상 1문장만 답변한다.',
      importance: 1,
    });

    const deleted = await storage.delete(created.id);
    const loaded = await storage.get(created.id);

    expect(deleted).to.equal(true);
    expect(loaded).to.equal(null);
  });

  it('preserves category separation for profile vs execution rules (S4)', async () => {
    const { storage } = makeStorage();

    await storage.save({
      category: 'user_profile',
      content: '사용자는 스타트업 CTO이다.',
      metadata: { type: 'identity' },
    });

    await storage.save({
      category: 'execution',
      content: '예시 코드는 TypeScript를 기본으로 제시한다.',
      metadata: { type: 'behavior_rule' },
    });

    const all = await storage.getAll();
    const categories = new Set(all.map((item) => item.category));

    expect(categories.has('user_profile')).to.equal(true);
    expect(categories.has('execution')).to.equal(true);
  });
});
