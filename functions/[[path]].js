export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      const API_URL = "https://script.google.com/macros/s/AKfycbxXpn0lB80LpLRaJHKBI5wgLjnyGLU-gXC3qTo-MxXBuJlHbTZ10ORuFdnDRl1LB2y5/exec";

      // ambil slug
      const match = path.match(/^\/artikel\/(.+)$/);
      const slug = match ? match[1] : null;

      // ambil data
      const res = await fetch(API_URL);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return new Response("Bukan JSON:\n" + text);
      }

      // ======================
      // 🏠 HOMEPAGE
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
      // 🔍 CARI ARTIKEL
      // ======================
      const artikel = data.find(item =>
        (item.slug && item.slug == slug) ||
        (item.id && item.id == slug)
      );

      if (!artikel) {
        return new Response("Artikel tidak ditemukan", { status: 404 });
      }

      // ======================
      // 🔥 META MINIMAL
      // ======================
      const title = artikel.title || "Artikel";
      const content = artikel.content || "";
      const desc = artikel.meta_description || content.substring(0, 160);

      return new Response(`
<html>
<head>
  <title>${title}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${desc}">
</head>

<body>
  <h1>${title}</h1>
  <p>${content}</p>
  <br><a href="/">← Kembali</a>
</body>
</html>
      `, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });

    } catch (err) {
      return new Response("ERROR:\n" + err.toString());
    }
  },
};
