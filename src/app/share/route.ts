import { NextRequest, NextResponse } from "next/server";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isTwitterBot(ua: string) {
  return /Twitterbot/i.test(ua);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const image = url.searchParams.get("image") ?? "";
  const ua = req.headers.get("user-agent") ?? "";

  const targetUrl = "https://www.answerbook.app/";
  const title = "Answer Book";
  const desc = "I just got guidance from the Answer Book";

  if (isTwitterBot(ua)) {
    const safeImage = escapeHtml(image);
    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(desc);
    const safeTarget = escapeHtml(targetUrl);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>${safeTitle}</title>

  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:url" content="${safeTarget}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
  <meta name="twitter:url" content="${safeTarget}" />

  <link rel="canonical" href="${safeTarget}" />
</head>
<body></body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",

        "cache-control": "no-store, max-age=0",
      },
    });
  }

  return NextResponse.redirect(targetUrl, 302);
}
