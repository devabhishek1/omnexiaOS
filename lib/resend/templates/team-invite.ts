import { getEmailStrings } from '@/lib/resend/email-i18n'

export function teamInviteTemplate(params: {
  businessName: string
  inviterName: string
  inviteUrl: string
  locale?: string
}): string {
  const s = getEmailStrings(params.locale)
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f1;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#2563EB;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Omnexia</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 12px">${s.inviteHeading(params.businessName)}</h1>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        ${s.inviteBody(params.inviterName, params.businessName)}
      </p>
      <a href="${params.inviteUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        ${s.inviteButton}
      </a>
      <p style="font-size:12px;color:#999;margin:24px 0 0">
        ${s.inviteFooter}
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <span style="font-size:11px;color:#bbb">${s.footerText}</span>
    </div>
  </div>
</body>
</html>`
}
