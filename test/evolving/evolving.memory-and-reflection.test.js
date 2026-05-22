const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

require('module-alias/register');

const LocalMemory = require('@src/agent/memory/LocalMemory');

function createTempMemory(memoryDir = 'evolving-test') {
  return new LocalMemory({
    memory_dir: memoryDir,
    key: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });
}

describe('Evolving :: short-term memory and reflection readiness', () => {
  it('stores and returns constraint messages in order (S1 baseline)', async () => {
    const memory = createTempMemory('evolving-s1');

    await memory.addMessage('user', '항상 한국어로 답변하고 bullet은 3개 이하로 작성해줘');
    await memory.addMessage('assistant', '알겠습니다. 다음 답변부터 반영하겠습니다.');

    const messages = await memory.getMessages();

    expect(messages).to.have.lengthOf(2);
    expect(messages[0].role).to.equal('user');
    expect(messages[0].content).to.include('항상 한국어');
    expect(messages[1].role).to.equal('assistant');
  });

  it('builds memorized action content for later prompt injection (S2 baseline)', async () => {
    const memory = createTempMemory('evolving-s2');

    await memory.addMessage(
      'user',
      '실행 실패: 출력 형식이 요구사항과 다릅니다. 표 형식으로 다시 작성하세요.',
      'reflection',
      true,
      {
        action_memory: '<memory><type>reflection</type><content>표 형식으로 다시 작성</content></memory>',
      }
    );

    const memorized = await memory.getMemorizedContent();

    expect(memorized).to.be.a('string');
    expect(memorized).to.include('reflection');
    expect(memorized).to.include('표 형식으로 다시 작성');
  });
});
