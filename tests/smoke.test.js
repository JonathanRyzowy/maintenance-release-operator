import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Smoke Tests', () => {
  it('should pass basic assertion', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should have valid contract files accessible', async () => {
    const fs = await import('node:fs/promises');
    
    const requiredFiles = [
      'GOAL.md',
      'FUNNEL.md',
      'SCOREBOARD.json',
      'POLICY.md'
    ];

    for (const file of requiredFiles) {
      const exists = await fs.access(file).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, `${file} should exist`);
    }
  });

  it('should have valid SCOREBOARD.json', async () => {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile('SCOREBOARD.json', 'utf-8');
    const data = JSON.parse(content);
    
    assert.ok(Array.isArray(data.entries), 'SCOREBOARD should have entries array');
    assert.ok(data.entries.length > 0, 'SCOREBOARD should have at least one entry');
    
    const entry = data.entries[0];
    assert.ok('date' in entry, 'Entry should have date');
    assert.ok('mrr_usd' in entry, 'Entry should have mrr_usd');
  });
});
