export type EmailLocale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'nl'

const strings = {
  en: {
    // team-invite
    inviteSubject: (biz: string) => `You've been invited to join ${biz} on Omnexia`,
    inviteHeading: (biz: string) => `You've been invited to join ${biz}`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> has invited you to collaborate on <strong>${biz}</strong>'s Omnexia workspace — your business OS for communications, finance, planning, and team management.`,
    inviteButton: 'Accept invitation →',
    inviteFooter: "This invitation link expires in 7 days. If you didn't expect this email, you can safely ignore it.",
    // time-off-request (sent to admin)
    timeOffRequestSubject: (emp: string) => `${emp} requested time off`,
    timeOffRequestHeading: 'New time-off request',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> has submitted a time-off request for <strong>${biz}</strong>.`,
    periodRequested: 'Period requested',
    reason: 'Reason',
    reviewButton: 'Review in Omnexia →',
    // time-off-response (sent to employee)
    timeOffResponseSubject: (approved: boolean) =>
      `Your time-off request has been ${approved ? 'approved' : 'rejected'}`,
    timeOffApprovedHeading: 'Your time-off request has been approved',
    timeOffRejectedHeading: 'Your time-off request has been rejected',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Hi <strong>${emp}</strong>, your time-off request for the following dates has been <strong>${approved ? 'approved' : 'rejected'}</strong> by <strong>${biz}</strong>.`,
    viewButton: 'View in Omnexia →',
    // invoice-overdue
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Invoice overdue: ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Invoice overdue — action required',
    invoiceOverdueBody: (client: string, days: number) =>
      `An invoice for <strong>${client}</strong> is <strong>${days} day${days !== 1 ? 's' : ''} overdue</strong>.`,
    outstandingAmount: 'Outstanding amount',
    invoiceOverdueAction: (biz: string) =>
      `Log in to <strong>${biz}</strong>'s Omnexia workspace to follow up with the client or mark the invoice as paid.`,
    viewInvoiceButton: 'View invoice →',
    // morning digest
    digestSubject: (date: string) => `Your Omnexia morning digest — ${date}`,
    digestGreeting: (biz: string) => `Good morning, ${biz}`,
    digestMessageCount: (n: number) => `${n} message${n !== 1 ? 's' : ''} in the last 24 hours`,
    openDashboard: 'Open dashboard →',
    // footer
    footerText: 'Omnexia — Business OS for European SMBs',
  },
  fr: {
    inviteSubject: (biz: string) => `Vous avez été invité à rejoindre ${biz} sur Omnexia`,
    inviteHeading: (biz: string) => `Vous avez été invité à rejoindre ${biz}`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> vous a invité à collaborer sur l'espace Omnexia de <strong>${biz}</strong> — votre OS métier pour les communications, la finance, la planification et la gestion d'équipe.`,
    inviteButton: "Accepter l'invitation →",
    inviteFooter: "Ce lien d'invitation expire dans 7 jours. Si vous n'attendiez pas cet e-mail, vous pouvez l'ignorer.",
    timeOffRequestSubject: (emp: string) => `${emp} a demandé un congé`,
    timeOffRequestHeading: 'Nouvelle demande de congé',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> a soumis une demande de congé pour <strong>${biz}</strong>.`,
    periodRequested: 'Période demandée',
    reason: 'Raison',
    reviewButton: 'Examiner dans Omnexia →',
    timeOffResponseSubject: (approved: boolean) =>
      `Votre demande de congé a été ${approved ? 'approuvée' : 'rejetée'}`,
    timeOffApprovedHeading: 'Votre demande de congé a été approuvée',
    timeOffRejectedHeading: 'Votre demande de congé a été rejetée',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Bonjour <strong>${emp}</strong>, votre demande de congé pour les dates suivantes a été <strong>${approved ? 'approuvée' : 'rejetée'}</strong> par <strong>${biz}</strong>.`,
    viewButton: 'Voir dans Omnexia →',
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Facture en retard : ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Facture en retard — action requise',
    invoiceOverdueBody: (client: string, days: number) =>
      `Une facture pour <strong>${client}</strong> est en retard de <strong>${days} jour${days !== 1 ? 's' : ''}</strong>.`,
    outstandingAmount: 'Montant dû',
    invoiceOverdueAction: (biz: string) =>
      `Connectez-vous à l'espace Omnexia de <strong>${biz}</strong> pour contacter le client ou marquer la facture comme payée.`,
    viewInvoiceButton: 'Voir la facture →',
    digestSubject: (date: string) => `Votre digest matinal Omnexia — ${date}`,
    digestGreeting: (biz: string) => `Bonjour, ${biz}`,
    digestMessageCount: (n: number) => `${n} message${n !== 1 ? 's' : ''} au cours des dernières 24 heures`,
    openDashboard: 'Ouvrir le tableau de bord →',
    footerText: 'Omnexia — OS métier pour les PME européennes',
  },
  de: {
    inviteSubject: (biz: string) => `Sie wurden eingeladen, ${biz} auf Omnexia beizutreten`,
    inviteHeading: (biz: string) => `Sie wurden eingeladen, ${biz} beizutreten`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> hat Sie eingeladen, am Omnexia-Workspace von <strong>${biz}</strong> mitzuwirken — Ihr Business OS für Kommunikation, Finanzen, Planung und Teammanagement.`,
    inviteButton: 'Einladung annehmen →',
    inviteFooter: 'Dieser Einladungslink läuft in 7 Tagen ab. Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.',
    timeOffRequestSubject: (emp: string) => `${emp} hat Urlaub beantragt`,
    timeOffRequestHeading: 'Neuer Urlaubsantrag',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> hat einen Urlaubsantrag für <strong>${biz}</strong> eingereicht.`,
    periodRequested: 'Beantragter Zeitraum',
    reason: 'Grund',
    reviewButton: 'In Omnexia prüfen →',
    timeOffResponseSubject: (approved: boolean) =>
      `Ihr Urlaubsantrag wurde ${approved ? 'genehmigt' : 'abgelehnt'}`,
    timeOffApprovedHeading: 'Ihr Urlaubsantrag wurde genehmigt',
    timeOffRejectedHeading: 'Ihr Urlaubsantrag wurde abgelehnt',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Hallo <strong>${emp}</strong>, Ihr Urlaubsantrag für die folgenden Termine wurde von <strong>${biz}</strong> <strong>${approved ? 'genehmigt' : 'abgelehnt'}</strong>.`,
    viewButton: 'In Omnexia ansehen →',
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Rechnung überfällig: ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Rechnung überfällig — Handlung erforderlich',
    invoiceOverdueBody: (client: string, days: number) =>
      `Eine Rechnung für <strong>${client}</strong> ist <strong>${days} Tag${days !== 1 ? 'e' : ''} überfällig</strong>.`,
    outstandingAmount: 'Ausstehender Betrag',
    invoiceOverdueAction: (biz: string) =>
      `Melden Sie sich beim Omnexia-Workspace von <strong>${biz}</strong> an, um den Kunden zu kontaktieren oder die Rechnung als bezahlt zu markieren.`,
    viewInvoiceButton: 'Rechnung ansehen →',
    digestSubject: (date: string) => `Ihr Omnexia-Morgendigest — ${date}`,
    digestGreeting: (biz: string) => `Guten Morgen, ${biz}`,
    digestMessageCount: (n: number) => `${n} Nachricht${n !== 1 ? 'en' : ''} in den letzten 24 Stunden`,
    openDashboard: 'Dashboard öffnen →',
    footerText: 'Omnexia — Business OS für europäische KMU',
  },
  es: {
    inviteSubject: (biz: string) => `Has sido invitado a unirte a ${biz} en Omnexia`,
    inviteHeading: (biz: string) => `Has sido invitado a unirte a ${biz}`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> te ha invitado a colaborar en el espacio de trabajo Omnexia de <strong>${biz}</strong> — tu OS empresarial para comunicaciones, finanzas, planificación y gestión de equipos.`,
    inviteButton: 'Aceptar invitación →',
    inviteFooter: 'Este enlace de invitación expira en 7 días. Si no esperabas este correo, puedes ignorarlo.',
    timeOffRequestSubject: (emp: string) => `${emp} ha solicitado tiempo libre`,
    timeOffRequestHeading: 'Nueva solicitud de tiempo libre',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> ha enviado una solicitud de tiempo libre para <strong>${biz}</strong>.`,
    periodRequested: 'Período solicitado',
    reason: 'Razón',
    reviewButton: 'Revisar en Omnexia →',
    timeOffResponseSubject: (approved: boolean) =>
      `Tu solicitud de tiempo libre ha sido ${approved ? 'aprobada' : 'rechazada'}`,
    timeOffApprovedHeading: 'Tu solicitud de tiempo libre ha sido aprobada',
    timeOffRejectedHeading: 'Tu solicitud de tiempo libre ha sido rechazada',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Hola <strong>${emp}</strong>, tu solicitud de tiempo libre para las siguientes fechas ha sido <strong>${approved ? 'aprobada' : 'rechazada'}</strong> por <strong>${biz}</strong>.`,
    viewButton: 'Ver en Omnexia →',
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Factura vencida: ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Factura vencida — acción requerida',
    invoiceOverdueBody: (client: string, days: number) =>
      `Una factura para <strong>${client}</strong> lleva <strong>${days} día${days !== 1 ? 's' : ''} de retraso</strong>.`,
    outstandingAmount: 'Monto pendiente',
    invoiceOverdueAction: (biz: string) =>
      `Inicia sesión en el espacio de trabajo Omnexia de <strong>${biz}</strong> para hacer seguimiento al cliente o marcar la factura como pagada.`,
    viewInvoiceButton: 'Ver factura →',
    digestSubject: (date: string) => `Tu resumen matutino de Omnexia — ${date}`,
    digestGreeting: (biz: string) => `Buenos días, ${biz}`,
    digestMessageCount: (n: number) => `${n} mensaje${n !== 1 ? 's' : ''} en las últimas 24 horas`,
    openDashboard: 'Abrir panel →',
    footerText: 'Omnexia — OS empresarial para PYME europeas',
  },
  it: {
    inviteSubject: (biz: string) => `Sei stato invitato a unirti a ${biz} su Omnexia`,
    inviteHeading: (biz: string) => `Sei stato invitato a unirti a ${biz}`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> ti ha invitato a collaborare nello spazio di lavoro Omnexia di <strong>${biz}</strong> — il tuo OS aziendale per comunicazioni, finanze, pianificazione e gestione del team.`,
    inviteButton: "Accetta l'invito →",
    inviteFooter: "Questo link di invito scade tra 7 giorni. Se non ti aspettavi questa email, puoi ignorarla.",
    timeOffRequestSubject: (emp: string) => `${emp} ha richiesto un permesso`,
    timeOffRequestHeading: 'Nuova richiesta di permesso',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> ha inviato una richiesta di permesso per <strong>${biz}</strong>.`,
    periodRequested: 'Periodo richiesto',
    reason: 'Motivo',
    reviewButton: 'Esamina in Omnexia →',
    timeOffResponseSubject: (approved: boolean) =>
      `La tua richiesta di permesso è stata ${approved ? 'approvata' : 'rifiutata'}`,
    timeOffApprovedHeading: 'La tua richiesta di permesso è stata approvata',
    timeOffRejectedHeading: 'La tua richiesta di permesso è stata rifiutata',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Ciao <strong>${emp}</strong>, la tua richiesta di permesso per le seguenti date è stata <strong>${approved ? 'approvata' : 'rifiutata'}</strong> da <strong>${biz}</strong>.`,
    viewButton: 'Visualizza in Omnexia →',
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Fattura scaduta: ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Fattura scaduta — azione richiesta',
    invoiceOverdueBody: (client: string, days: number) =>
      `Una fattura per <strong>${client}</strong> è scaduta da <strong>${days} giorno${days !== 1 ? 'i' : ''}</strong>.`,
    outstandingAmount: 'Importo in sospeso',
    invoiceOverdueAction: (biz: string) =>
      `Accedi allo spazio di lavoro Omnexia di <strong>${biz}</strong> per contattare il cliente o contrassegnare la fattura come pagata.`,
    viewInvoiceButton: 'Visualizza fattura →',
    digestSubject: (date: string) => `Il tuo digest mattutino Omnexia — ${date}`,
    digestGreeting: (biz: string) => `Buongiorno, ${biz}`,
    digestMessageCount: (n: number) => `${n} messagg${n !== 1 ? 'i' : 'io'} nelle ultime 24 ore`,
    openDashboard: 'Apri dashboard →',
    footerText: 'Omnexia — OS aziendale per le PMI europee',
  },
  nl: {
    inviteSubject: (biz: string) => `Je bent uitgenodigd om lid te worden van ${biz} op Omnexia`,
    inviteHeading: (biz: string) => `Je bent uitgenodigd om lid te worden van ${biz}`,
    inviteBody: (inviter: string, biz: string) =>
      `<strong>${inviter}</strong> heeft je uitgenodigd om samen te werken in de Omnexia-werkruimte van <strong>${biz}</strong> — jouw business OS voor communicatie, financiën, planning en teambeheer.`,
    inviteButton: 'Uitnodiging accepteren →',
    inviteFooter: 'Deze uitnodigingslink verloopt over 7 dagen. Als je deze e-mail niet verwachtte, kun je hem negeren.',
    timeOffRequestSubject: (emp: string) => `${emp} heeft verlof aangevraagd`,
    timeOffRequestHeading: 'Nieuw verlofverzoek',
    timeOffRequestBody: (emp: string, biz: string) =>
      `<strong>${emp}</strong> heeft een verlofverzoek ingediend voor <strong>${biz}</strong>.`,
    periodRequested: 'Aangevraagde periode',
    reason: 'Reden',
    reviewButton: 'Bekijken in Omnexia →',
    timeOffResponseSubject: (approved: boolean) =>
      `Je verlofverzoek is ${approved ? 'goedgekeurd' : 'afgewezen'}`,
    timeOffApprovedHeading: 'Je verlofverzoek is goedgekeurd',
    timeOffRejectedHeading: 'Je verlofverzoek is afgewezen',
    timeOffResponseBody: (emp: string, approved: boolean, biz: string) =>
      `Hallo <strong>${emp}</strong>, je verlofverzoek voor de volgende datums is <strong>${approved ? 'goedgekeurd' : 'afgewezen'}</strong> door <strong>${biz}</strong>.`,
    viewButton: 'Bekijken in Omnexia →',
    invoiceOverdueSubject: (client: string, currency: string, amount: string) =>
      `Factuur achterstallig: ${client} — ${currency} ${amount}`,
    invoiceOverdueHeading: 'Factuur achterstallig — actie vereist',
    invoiceOverdueBody: (client: string, days: number) =>
      `Een factuur voor <strong>${client}</strong> is <strong>${days} dag${days !== 1 ? 'en' : ''} achterstallig</strong>.`,
    outstandingAmount: 'Openstaand bedrag',
    invoiceOverdueAction: (biz: string) =>
      `Log in op de Omnexia-werkruimte van <strong>${biz}</strong> om contact op te nemen met de klant of de factuur als betaald te markeren.`,
    viewInvoiceButton: 'Factuur bekijken →',
    digestSubject: (date: string) => `Jouw Omnexia ochtenddigest — ${date}`,
    digestGreeting: (biz: string) => `Goedemorgen, ${biz}`,
    digestMessageCount: (n: number) => `${n} bericht${n !== 1 ? 'en' : ''} in de afgelopen 24 uur`,
    openDashboard: 'Dashboard openen →',
    footerText: 'Omnexia — Business OS voor Europees MKB',
  },
}

const SUPPORTED: EmailLocale[] = ['en', 'fr', 'de', 'es', 'it', 'nl']

export function getEmailStrings(locale: string | null | undefined) {
  const l = (locale ?? 'en') as EmailLocale
  return strings[SUPPORTED.includes(l) ? l : 'en']
}
