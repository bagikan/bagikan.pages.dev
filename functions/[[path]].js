export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname;

    const API_URL = "https://script.google.com/macros/s/AKfycbxXpn0lB80LpLRaJHKBI5wgLjnyGLU-gXC3qTo-MxXBuJlHbTZ10ORuFdnDRl1LB2y5/exec";
    const DOMAIN = url.origin;

    // ambil slug
    const match = path.match(/^\/artikel\/(.+)$/);
    const slug = match ? match[1] : null;

// ======================
// 🗺️ SITEMAP.XML
// ======================
if (path === "/sitemap.xml") {
  const items = data.map(item => {
    const s = item.slug || item.id;
    const loc = `${DOMAIN}/artikel/${s}`;

    return `
      <url>
        <loc>${loc}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    `;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${DOMAIN}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    ${items}
  </urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml" },
  });
}



    // fetch data
    const res = await fetch(API_URL);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response("Bukan JSON:\n" + text);
    }

    // ======================
    // HOMEPAGE
    // ======================
    if (!slug) {
      let html = `<h1>Daftar Artikel</h1><ul>`;

      data.forEach(item => {
        const s = item.slug || item.id;
        html += `<li><a href="/artikel/${s}">${item.title}</a></li>`;
      });

      html += `</ul>`;

      return new Response(html, {
        headers: { "content-type": "text/html" },
      });
    }

    // ======================
    // CARI ARTIKEL
    // ======================
    const artikel = data.find(item =>
      (item.slug && item.slug == slug) ||
      (item.id && item.id == slug)
    );

    if (!artikel) {
      return new Response("Not found", { status: 404 });
    }

    const title = artikel.title || "Artikel";
    const content = artikel.content || "";
    const desc = artikel.meta_description || content.substring(0, 140);
    const image = artikel.image || "https://via.placeholder.com/1200x630";

    const fullUrl = `${DOMAIN}/artikel/${slug}`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": desc,
      "image": image
    };

    return new Response(`
      <html>
      <head>
        <title>${title}</title>

        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${desc}">
        <link rel="canonical" href="${fullUrl}">

        <!-- OG -->
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${image}">

        <!-- JSON-LD -->
        <script type="application/ld+json">
          ${JSON.stringify(jsonLd)}
        </script>
      </head>

      <body>
        <h1>${title}</h1>
        <p>${content}</p>
        <a href="/">← Kembali</a>
      </body>
      </html>
    `, {
      headers: { "content-type": "text/html" },
    });

  } catch (err) {
    return new Response("Error:\n" + err.toString());
  }
}
