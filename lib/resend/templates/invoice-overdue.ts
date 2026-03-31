export function invoiceOverdueTemplate(params: {
  businessName: string
  clientName: string
  amount: string
  currency: string
  daysOverdue: number
  invoiceUrl: string
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
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">Invoice overdue — action required</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 8px">
        An invoice for <strong>${params.clientName}</strong> is <strong>${params.daysOverdue} day${params.daysOverdue !== 1 ? 's' : ''} overdue</strong>.
      </p>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px 20px;margin:16px 0">
        <div style="font-size:13px;color:#92400E;font-weight:500">Outstanding amount</div>
        <div style="font-size:24px;font-weight:700;color:#92400E;margin-top:4px">${params.currency}${params.amount}</div>
      </div>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        Log in to <strong>${params.businessName}</strong>'s Omnexia workspace to follow up with the client or mark the invoice as paid.
      </p>
      <a href="${params.invoiceUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        View invoice →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}
