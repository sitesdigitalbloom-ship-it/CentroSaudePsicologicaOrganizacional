// Proxy fino para o snapshot central do blog. Nenhum segredo e exposto:
// o upstream contem somente paginas que ja sao publicas no site.
const ORIGIN =
  "https://grcawayafeeifxuzafkh.supabase.co/functions/v1/entregar-blog/centro-saude-psicologica-organizacional";
const SAFE_PATH =
  /^(?:\/sitemap\.xml|\/blog\/(?:index\.html|chamada\.html|feed\.json|sitemap\.xml|[a-z0-9][a-z0-9-]{0,199}\.html))$/;
const LIST_PATHS = new Set([
  "/sitemap.xml",
  "/blog/index.html",
  "/blog/chamada.html",
  "/blog/feed.json",
  "/blog/sitemap.xml",
]);

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function contentType(path) {
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "text/html; charset=utf-8";
}

function setHealthyCache(response, path) {
  const seconds = LIST_PATHS.has(path) ? 60 : 300;
  response.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${seconds}, must-revalidate, stale-if-error=604800`,
  );
  response.setHeader(
    "CDN-Cache-Control",
    `public, s-maxage=${seconds}, must-revalidate, stale-if-error=604800`,
  );
  response.setHeader(
    "Vercel-CDN-Cache-Control",
    `public, s-maxage=${seconds}, must-revalidate, stale-if-error=604800`,
  );
}

module.exports = async function blogDelivery(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    response.setHeader("Cache-Control", "no-store");
    return response.status(405).send("Metodo nao permitido");
  }

  const path = String(queryValue(request.query?.path) || "/blog/index.html")
    .toLowerCase();
  if (!SAFE_PATH.test(path)) {
    response.setHeader("Cache-Control", "no-store");
    return response.status(400).send("Rota invalida");
  }

  try {
    const upstreamHeaders = {};
    if (request.headers["if-none-match"]) {
      upstreamHeaders["If-None-Match"] = request.headers["if-none-match"];
    }
    if (request.headers["if-modified-since"]) {
      upstreamHeaders["If-Modified-Since"] =
        request.headers["if-modified-since"];
    }

    const upstream = await fetch(`${ORIGIN}${path}`, {
      method: request.method,
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(15_000),
    });

    if (upstream.status >= 500) throw new Error(`Origem HTTP ${upstream.status}`);
    response.setHeader("Content-Type", contentType(path));
    response.setHeader("X-DBB-Proxy", "vercel-v2");
    for (const name of [
      "etag",
      "last-modified",
      "location",
      "x-dbb-delivery",
      "x-content-type-options",
      "referrer-policy",
    ]) {
      const value = upstream.headers.get(name);
      if (value) response.setHeader(name, value);
    }

    if (upstream.ok || upstream.status === 304) setHealthyCache(response, path);
    else response.setHeader("Cache-Control", "no-store");
    if (process.env.VERCEL_ENV === "preview") {
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
    }

    response.statusCode = upstream.status;
    if (request.method === "HEAD" || upstream.status === 304) {
      return response.end();
    }
    return response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error("blog-delivery:", String(error));
    try {
      const fs = require("node:fs/promises");
      const body = await fs.readFile(require("node:path").join(process.cwd(), path));
      response.setHeader("Content-Type", contentType(path));
      response.setHeader("X-DBB-Fallback", "deploy-anterior");
      response.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      response.statusCode = 200;
      return response.end(request.method === "HEAD" ? undefined : body);
    } catch {}
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).send("Origem temporariamente indisponivel");
  }
};
