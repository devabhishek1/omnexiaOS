const PENNYLANE_BASE = 'https://app.pennylane.com/api/external/v1'

export async function pennylaneRequest<T = unknown>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PENNYLANE_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Pennylane API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}
