// Purpose: Client API helper to fetch server health status.
export async function fetchHealth() {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const getHealth = fetchHealth;
export default fetchHealth;

