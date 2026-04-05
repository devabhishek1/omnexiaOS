export function teamInviteTemplate(params: {
  businessName: string
  inviterName: string
  inviteUrl: string
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
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">You've been invited to join ${params.businessName}</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        <strong>${params.inviterName}</strong> has invited you to collaborate on <strong>${params.businessName}</strong>'s Omnexia workspace — your business OS for communications, finance, planning, and team management.
      </p>
      <a href="${params.inviteUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Accept invitation →
      </a>
      <p style="font-size:12px;color:#999;margin:24px 0 0">
        This invitation link expires in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">Omnexia — Business OS for European SMBs</span>
    </div>
  </div>
</body>
</html>`
}
