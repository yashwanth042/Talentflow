export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${input}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

