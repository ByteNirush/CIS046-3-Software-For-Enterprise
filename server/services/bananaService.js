//
// Real observed Banana API response structure:
// Endpoint: http://marcconrad.com/uob/banana/api.php?out=json&base64=yes
// Observed JSON fields:
//   "question": string (raw base64-encoded PNG image data, beginning with 'iVBORw0KGgo...' and ending with PNG IEND chunk)
//   "solution": number (single-digit integer between 0 and 9, e.g., 0, 1, 2, ..., 9)
//
// Why base64 is used:
// The browser never contacts the Banana host directly, which avoids mixed-content problems
// (the upstream API endpoint was designed for HTTP) and keeps all third-party communication
// confined securely to our server.

import config from '../config/index.js';

export class BananaServiceError extends Error {
  constructor(message = 'Puzzle service is unavailable') {
    super(message);
    this.name = 'BananaServiceError';
    this.statusCode = 502;
  }
}

/**
 * Fetches a new puzzle from the Banana API.
 * Returns an object with { image, solution }.
 * - image: base64 string of the puzzle image
 * - solution: string representation of the single-digit solution ("0" through "9")
 */
export async function fetchPuzzle() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.bananaTimeoutMs);

  let response;
  try {
    const url = new URL(config.bananaApiUrl);
    url.searchParams.set('out', 'json');
    url.searchParams.set('base64', 'yes');

    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[bananaService] Failure: timeout');
      throw new BananaServiceError('Banana API request timed out');
    }
    console.error('[bananaService] Failure: network error');
    throw new BananaServiceError('Failed to communicate with Banana API');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error('[bananaService] Failure: bad status');
    throw new BananaServiceError('Banana API returned non-ok HTTP status');
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error('[bananaService] Failure: invalid json');
    throw new BananaServiceError('Failed to parse Banana API JSON response');
  }

  // Validate response shape:
  // The API returns { question: <base64>, solution: <digit> }.
  // Accept 'question' or 'image' for flexibility with mocks/future API changes.
  const rawImage = typeof data?.question === 'string' && data.question.trim().length > 0
    ? data.question
    : typeof data?.image === 'string' && data.image.trim().length > 0
      ? data.image
      : null;

  const rawSolution = data?.solution !== undefined && data?.solution !== null
    ? String(data.solution).trim()
    : null;

  const isSingleDigit = rawSolution !== null && /^[0-9]$/.test(rawSolution);

  if (!rawImage || !isSingleDigit) {
    console.error('[bananaService] Failure: invalid response shape');
    throw new BananaServiceError('Banana API response had invalid shape or missing fields');
  }

  return {
    image: rawImage,
    solution: rawSolution,
  };
}

export default {
  fetchPuzzle,
  BananaServiceError,
};
