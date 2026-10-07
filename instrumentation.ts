export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { sweepTempDirs } = await import('./lib/jobs/tempdir');
    await sweepTempDirs().catch(() => 0);
  }
}
