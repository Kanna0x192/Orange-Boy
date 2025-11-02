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
  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Strapi ${res.status}: ${raw}`);
  }
  if (!raw || raw.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Strapi parse error: ${err}`);
  }
}
