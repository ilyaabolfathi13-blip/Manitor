export const config = {
  runtime: "edge",
};

const REMOTE_NODE = "https://ver.switchnet.sbs:8096";

export default async function monitoringSystem(req) {
  const url = new URL(req.url);
  const userAgent = req.headers.get("user-agent") || "";

  // --- بخش آنتی-بن و داشبورد فیک ---
  // اگر کاربر با مرورگر وارد شود، داشبورد را می‌بیند
  if (url.pathname === "/" && userAgent.includes("Mozilla")) {
    const usagePercent = (Math.random() * (15.5 - 10.2) + 10.2).toFixed(2); // عدد مصرف فیک
    const executionTime = Math.floor(Math.random() * 40) + 10;

    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Edge Node Analytics</title>
          <style>
              body { background: #0a0a0a; color: #d1d1d1; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; }
              .card { border: 1px solid #333; padding: 20px; border-radius: 8px; background: #111; max-width: 600px; margin: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              .status { color: #00ff88; font-weight: bold; }
              .stat-row { display: flex; justify-content: space-between; margin: 15px 0; border-bottom: 1px solid #222; padding-bottom: 8px; }
              .bar-bg { background: #222; height: 10px; width: 100%; border-radius: 5px; margin-top: 10px; }
              .bar-fill { background: linear-gradient(90deg, #00c6ff, #0072ff); height: 100%; border-radius: 5px; width: ${usagePercent}%; }
              h1 { font-size: 1.2rem; color: #fff; margin-bottom: 25px; }
              code { color: #ff79c6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>System Health Monitor <span style="font-size: 0.8rem; color: #666;">v4.2.0-stable</span></h1>
              <div class="stat-row"><span>Environment:</span> <code>Vercel Edge (Global)</code></div>
              <div class="stat-row"><span>Status:</span> <span class="status">HEALTHY</span></div>
              <div class="stat-row"><span>Latency:</span> <span>${executionTime}ms</span></div>
              <div class="stat-row"><span>Account Usage:</span> <span>${usagePercent}%</span></div>
              <div class="bar-bg"><div class="bar-fill"></div></div>
              <p style="font-size: 0.7rem; color: #444; margin-top: 30px;">
                  All edge functions are operating within normal parameters. 
                  Last synchronized: ${new Date().toISOString()}
              </p>
          </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // --- بخش پروکسی مخفی ---
  try {
    const finalUrl = REMOTE_NODE + url.pathname + url.search;
    const cleanHeaders = new Headers();

    for (const [key, value] of req.headers.entries()) {
      const k = key.toLowerCase();
      // حذف هدرهای حساس که ورسل را مشکوک می‌کند
      if (!["host", "connection", "upgrade", "te", "transfer-encoding"].includes(k) && !k.startsWith("x-vercel")) {
        cleanHeaders.set(k, value);
      }
    }

    // پنهان کردن IP اصلی
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    if (clientIp) cleanHeaders.set("X-Forwarded-For", clientIp.split(',')[0]);

    const options = {
      method: req.method,
      headers: cleanHeaders,
      redirect: "manual",
      ...(req.body && { body: req.body, duplex: "half" })
    };

    const response = await fetch(finalUrl, options);
    
    // کپی هدرها و حذف موارد مشکوک
    const proxyHeaders = new Headers(response.headers);
    proxyHeaders.delete("transfer-encoding");
    proxyHeaders.set("Cache-Control", "no-store");

    return new Response(response.body, {
      status: response.status,
      headers: proxyHeaders,
    });

  } catch (err) {
    return new Response("Internal Optimization in Progress", { status: 503 });
  }
}
