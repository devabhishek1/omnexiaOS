export function digestEmailTemplate(params: {
  businessName: string
  date: string
  content: string
  messageCount: number
  dashboardUrl: string
}): string {
  // Convert newlines to <br> for HTML display
  const htmlContent = params.content.replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="background:#EEF2FF;color:#6366F1;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:0.04em">✦ AI DIGEST</span>
        <span style="font-size:12px;color:#999">${params.date}</span>
      </div>
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">Good morning, ${params.businessName}</h1>
      <p style="font-size:13px;color:#777;margin:0 0 20px">${params.messageCount} message${params.messageCount !== 1 ? 's' : ''} in the last 24 hours</p>
      <div style="font-size:14px;color:#333;line-height:1.7;margin:0 0 24px;padding:20px;background:#F8F8F5;border-radius:8px;border-left:3px solid #6366F1">
        ${htmlContent}
      </div>
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Open dashboard →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}
