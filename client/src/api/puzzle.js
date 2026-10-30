async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function newPuzzle() {
  const response = await fetch('/api/puzzle/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  });
  return handleResponse(response);
}

export async function submitAnswer(id, guess) {
  const response = await fetch(`/api/puzzle/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ guess }),
  });
  return handleResponse(response);
}

export default {
  newPuzzle,
  submitAnswer,
};

