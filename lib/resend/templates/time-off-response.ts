export function timeOffResponseTemplate(params: {
  employeeName: string
  status: 'approved' | 'rejected'
  startDate: string
  endDate: string
  businessName: string
  dashboardUrl: string
}): string {
  const approved = params.status === 'approved'
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
        Your time-off request has been ${approved ? 'approved' : 'rejected'}
      </h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px">
        Hi <strong>${params.employeeName}</strong>, your time-off request for the following dates has been <strong>${params.status}</strong> by <strong>${params.businessName}</strong>.
      </p>
      <div style="background:${approved ? '#DCFCE7' : '#FEE2E2'};border:1px solid ${approved ? '#BBF7D0' : '#FECACA'};border-radius:8px;padding:16px 20px;margin:16px 0">
        <div style="font-size:13px;color:${approved ? '#15803D' : '#DC2626'};font-weight:500">Period requested</div>
        <div style="font-size:16px;font-weight:700;color:${approved ? '#15803D' : '#DC2626'};margin-top:4px">${params.startDate} → ${params.endDate}</div>
      </div>
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        View in Omnexia →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}
