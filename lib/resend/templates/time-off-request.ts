export function timeOffRequestTemplate(params: {
  employeeName: string
  startDate: string
  endDate: string
  reason: string | null
  businessName: string
  dashboardUrl: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">
        New time-off request
      </h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px">
        <strong>${params.employeeName}</strong> has submitted a time-off request for <strong>${params.businessName}</strong>.
      </p>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin:16px 0">
        <div style="font-size:13px;color:#2563EB;font-weight:500">Period requested</div>
        <div style="font-size:16px;font-weight:700;color:#1D4ED8;margin-top:4px">${params.startDate} → ${params.endDate}</div>
        ${params.reason ? `<div style="font-size:13px;color:#3B82F6;margin-top:8px">Reason: ${params.reason}</div>` : ''}
      </div>
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Review in Omnexia →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}
