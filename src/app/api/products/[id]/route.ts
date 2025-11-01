import { strapiFetch } from "@/lib/strapi";

export async function PUT(_: Request, { params }: { params: { id: string } }) {
  const body = await _.json();
  const data = await strapiFetch(`/api/products/${params.id}`, {
    method: "PUT",
    body: JSON.stringify({ data: body }),
  });
  return Response.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await strapiFetch(`/api/products/${params.id}`, { method: "DELETE" });
  return new Response(null, { status: 204 });
}
