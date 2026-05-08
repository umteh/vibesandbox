import { createHmac, timingSafeEqual } from 'crypto';

const REPLAY_WINDOW_SECONDS = 300; // 5 minutes

function secret(): string {
  const s = process.env.SCORER_HMAC_SECRET;
  if (!s) throw new Error('SCORER_HMAC_SECRET env var is not set');
  return s;
}

export function signScorePayload(listingId: string, scoreJson: string, ts: number): string {
  const payload = `${listingId}:${scoreJson}:${ts}`;
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

// Returns null on success, or an error string describing why it failed
export function verifyScoreCallback(
  signature: string | null,
  listingId: string,
  scoreJson: string,
  ts: number
): string | null {
  if (!signature) return 'missing signature header';

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > REPLAY_WINDOW_SECONDS) {
    return `timestamp outside ${REPLAY_WINDOW_SECONDS}s replay window`;
  }

  const expected = signScorePayload(listingId, scoreJson, ts);
  const expectedBuf = Buffer.from(expected, 'hex');
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, 'hex');
  } catch {
    return 'signature is not valid hex';
  }
  if (expectedBuf.length !== sigBuf.length) return 'signature length mismatch';
  if (!timingSafeEqual(expectedBuf, sigBuf)) return 'signature mismatch';
  return null;
}
