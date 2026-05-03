export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname;

    const API_URL = "https://script.google.com/macros/s/AKfycbxXpn0lB80LpLRaJHKBI5wgLjnyGLU-gXC3qTo-MxXBuJlHbTZ10ORuFdnDRl1LB2y5/exec";
    const DOMAIN = url.origin;

    const match = path.match(/^\/artikel\/(.+)$/);
    const slug = match ? match[1] : null;

    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = 12;

    // ======================
    // FETCH DATA
    // ======================
    const res = await fetch(API_URL);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
      if (!Array.isArray(data)) data = [];
    } catch {
      return new Response("Bukan JSON:\n" + text);
    }

    // ======================
    // HOMEPAGE AMP (PAGINATION)
    // ======================
    if (!slug) {

      const start = (page - 1) * perPage;
      const paginated = data.slice(start, start + perPage);

      let items = "";

      paginated.forEach(item => {
        let s = (item.slug || item.id || "").toString().toLowerCase().replace(/\s+/g, "-");

        const title = item.title || "Artikel";
        const desc = (item.meta_description || "").substring(0, 100);

        const image = item.image && item.image.trim() !== ""
          ? item.image
          : "/default.png";

        items += `
          <div class="card">
            <a href="/artikel/${s}">
              <amp-img 
                src="${image}" 
                width="400" 
                height="200" 
                layout="responsive"
                alt="${title}">
              </amp-img>
              <h2>${title}</h2>
              <p>${desc}</p>
            </a>
          </div>
        `;
      });

      // pagination
      const totalPages = Math.ceil(data.length / perPage);

      let pagination = `<div class="pagination">`;
      for (let i = 1; i <= totalPages; i++) {
        pagination += `<a href="/?page=${i}" ${i === page ? 'style="font-weight:bold"' : ''}>${i}</a>`;
      }
      pagination += `</div>`;

      return new Response(`
<!doctype html>
<html amp>
<head>
  <meta charset="utf-8">
  <title>Blog AMP - Page ${page}</title>

  <link rel="canonical" href="${DOMAIN}/?page=${page}">
  <meta name="viewport" content="width=device-width,minimum-scale=1">

  <script async src="https://cdn.ampproject.org/v0.js"></script>

  <style amp-boilerplate>
    body{visibility:hidden}
  </style>
  <noscript>
    <style amp-boilerplate>
      body{visibility:visible}
    </style>
  </noscript>

  <style amp-custom>
    body{font-family:sans-serif;background:#f5f5f5;padding:10px;}
    .grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }
    .card{
      background:#fff;
      padding:10px;
      border-radius:8px;
    }
    h2{font-size:16px;}
    .pagination{
      margin-top:20px;
      text-align:center;
    }
    .pagination a{
      margin:5px;
      text-decoration:none;
    }
  </style>
</head>

<body>

<h1>Blog AMP</h1>

<div class="grid">
  ${items}
</div>

${pagination}

</body>
</html>
      `, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // ======================
    // ARTIKEL AMP
    // ======================
    const artikel = data.find(item => {
      let s = (item.slug || item.id || "").toString().toLowerCase().replace(/\s+/g, "-");
      return s === slug;
    });

    if (!artikel) {
      return new Response("Not found", { status: 404 });
    }

    const title = artikel.title || "Artikel";
    const content = artikel.content || "";
    const desc = artikel.meta_description || content.substring(0, 140);

    const image = artikel.image && artikel.image.trim() !== ""
      ? artikel.image
      : "/default.png";

    return new Response(`
<!doctype html>
<html amp>
<head>
  <meta charset="utf-8">
  <title>${title}</title>

  <link rel="canonical" href="https://acc.injector.workers.dev/artikel/${slug}">
  <meta name="viewport" content="width=device-width,minimum-scale=1">

  <script async src="https://cdn.ampproject.org/v0.js"></script>

  <style amp-boilerplate>
    body{visibility:hidden}
  </style>
  <noscript>
    <style amp-boilerplate>
      body{visibility:visible}
    </style>
  </noscript>

  <style amp-custom>
    body{font-family:sans-serif;padding:15px;}
    h1{font-size:22px;}
    p{line-height:1.6;}
  </style>
</head>

<body>

<h1>${title}</h1>

<amp-img 
  src="${image}" 
  width="800" 
  height="400" 
  layout="responsive"
  alt="${title}">
</amp-img>

<p>${desc}</p>

${content}

<br><a href="https://acc.injector.workers.dev/artikel/${slug}">
Versi Normal
</a>

</body>
</html>
    `, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });

  } catch (err) {
    return new Response("ERROR:\n" + err.toString());
  }
}
