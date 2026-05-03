export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname;

    const API_URL = "https://script.google.com/macros/s/AKfycbxXpn0lB80LpLRaJHKBI5wgLjnyGLU-gXC3qTo-MxXBuJlHbTZ10ORuFdnDRl1LB2y5/exec";
    const DOMAIN = url.origin;

    const match = path.match(/^\/artikel\/(.+)$/);
    const slug = match ? match[1] : null;

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
    const desc = artikel.meta_description || content.substring(0, 150);
    const image = artikel.image || "https://via.placeholder.com/1200x630";
    const author = artikel.author || "Admin";
    const date = artikel.date || new Date().toISOString();

    const fullUrl = `${DOMAIN}/artikel/${slug}`;

    // 🔥 JSON-LD LEBIH KOMPLIT
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": desc,
      "image": [image],
      "author": {
        "@type": "Person",
        "name": author
      },
      "datePublished": date,
      "dateModified": date,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": fullUrl
      }
    };

    return new Response(`
      <html>
      <head>
        <title>${title}</title>

        <!-- BASIC -->
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${desc}">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="${fullUrl}">

        <!-- OPEN GRAPH -->
        <meta property="og:type" content="article">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:url" content="${fullUrl}">
        <meta property="og:image" content="${image}">
        <meta property="og:site_name" content="Website Kamu">

        <!-- TWITTER -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${desc}">
        <meta name="twitter:image" content="${image}">

        <!-- EXTRA -->
        <meta name="author" content="${author}">
        <meta name="theme-color" content="#ffffff">

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
      headers: { "content-type": "text/html;charset=UTF-8" },
    });

  } catch (err) {
    return new Response("Error:\n" + err.toString());
  }
}
