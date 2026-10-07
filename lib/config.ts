function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const MAX_FILE_MB = envNumber('MAX_FILE_MB', 50);
export const JOB_TIMEOUT_MS = envNumber('JOB_TIMEOUT_MS', 120000);
export const MODEL_CACHE_DIR = '.cache/models';
