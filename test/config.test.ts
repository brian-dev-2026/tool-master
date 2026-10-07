import { describe, expect, it } from 'vitest';
import { JOB_TIMEOUT_MS, MAX_FILE_MB, MODEL_CACHE_DIR } from '@/lib/config';

describe('config', () => {
  it('uses the spec defaults', () => {
    expect(MAX_FILE_MB).toBe(50);
    expect(JOB_TIMEOUT_MS).toBe(120000);
    expect(MODEL_CACHE_DIR).toBe('.cache/models');
  });
});
