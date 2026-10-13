import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url }) => {
  const backend = process.env.BACKEND_URL ?? "http://backend:3000";

  try {
    const response = await fetch(`${backend}/api/${params.path}${url.search}`);
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Бэкенд недоступен" }), {
      status: 502,
    });
  }
};
