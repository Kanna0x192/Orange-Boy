const CMS = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN!;

export async function strapiFetch(path: string, init: RequestInit = {}) {
  const url = `${CMS}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`Strapi ${res.status}: ${text}`);
  }
  return res.json();
}
