export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'nl'

export interface OnboardingStrings {
  // Global chrome
  stepOf: (step: number, total: number) => string
  stepLabels: [string, string, string, string, string, string, string, string, string]
  back: string
  continue: string
  skip: string
  getStarted: string

  // Step 1
  s1: { heading: string; subtitle: string; selectPrompt: string }

  // Step 2
  s2: {
    heading: string; subtitle: string
    businessName: string; businessNamePlaceholder: string
    logo: string; logoOptional: string
    uploadPrompt: string; uploadHint: string; clickToChange: string
  }

  // Step 3
  s3: {
    heading: string; subtitle: string
    countryLabel: string; countryPlaceholder: string
    vatRate: string; currency: string; dateFormat: string
    vatFormat: string; vatHint: string; requiredHint: string
  }

  // Step 4
  s4: {
    heading: string; subtitle: string
    industries: [
      { label: string; desc: string },
      { label: string; desc: string },
      { label: string; desc: string },
      { label: string; desc: string },
      { label: string; desc: string },
    ]
  }

  // Step 5
  s5: {
    heading: string; subtitle: string
    sizes: [
      { desc: string }, { desc: string }, { desc: string }
    ]
  }

  // Step 6
  s6: {
    heading: string; subtitle: string
    permissionRead: string; permissionSync: string; permissionCalendar: string
    connect: string; connecting: string; skipLink: string
    connectedLabel: string; connectedSub: string
  }

  // Step 7
  s7: {
    heading: string; subtitle: string
    required: string
    modules: [
      { label: string; desc: string },
      { label: string; desc: string },
      { label: string; desc: string },
      { label: string; desc: string },
    ]
  }

  // Step 8
  s8: {
    heading: string; subtitle: string
    placeholder: string; addBtn: string
    noTeammates: string
    errInvalid: string; errDuplicate: string
  }

  // Step 9
  s9: {
    heading: string; subtitle: string; saving: string
    rowBusiness: string; rowCountry: string; rowIndustry: string
    rowSize: string; rowGmail: string; rowModules: string; rowInvites: string
    gmailConnected: string; gmailSkipped: string
    notSpecified: string; inviteCount: (n: number) => string; inviteNone: string
    employeesSuffix: string
  }
}

const en: OnboardingStrings = {
  stepOf: (s, t) => `STEP ${s} OF ${t}`,
  stepLabels: ['LANGUAGE', 'BUSINESS', 'COUNTRY', 'INDUSTRY', 'TEAM SIZE', 'GMAIL', 'MODULES', 'INVITE', 'DONE'],
  back: 'Back', continue: 'Continue', skip: 'Skip', getStarted: 'Get started',
  s1: { heading: 'Welcome to Omnexia', subtitle: 'Your professional OS for Europe', selectPrompt: 'Select your language to get started' },
  s2: { heading: 'Tell us about your business', subtitle: 'This information will appear throughout your workspace.', businessName: 'Business name', businessNamePlaceholder: 'Acme Corp', logo: 'Logo', logoOptional: '(optional)', uploadPrompt: 'Click to upload logo', uploadHint: 'PNG, JPG, SVG — max 2MB', clickToChange: 'Click to change' },
  s3: { heading: 'Where is your business based?', subtitle: 'This sets your VAT format, currency, and date display.', countryLabel: 'Country / Region', countryPlaceholder: 'Select a country…', vatRate: 'VAT Rate (%)', currency: 'Currency', dateFormat: 'Date Format', vatFormat: 'VAT Number Format', vatHint: 'Pre-filled with the standard format for your country. You can override this.', requiredHint: 'Required — this affects VAT calculations across the app.' },
  s4: { heading: 'What type of business are you?', subtitle: 'Select the option that best describes your business.', industries: [{ label: 'E-commerce', desc: 'Online store or marketplace' }, { label: 'Agency', desc: 'Creative, digital, or media agency' }, { label: 'Consulting', desc: 'Professional services & advisory' }, { label: 'Physical Retail', desc: 'Stores, restaurants, hospitality' }, { label: 'Other', desc: "Doesn't fit the above" }] },
  s5: { heading: 'How many employees do you have?', subtitle: 'This helps us tailor your experience.', sizes: [{ desc: 'Small team' }, { desc: 'Growing team' }, { desc: 'Medium business' }] },
  s6: { heading: 'Connect your Gmail', subtitle: 'Sync your inbox to manage all communications in one place.', permissionRead: 'Read and send emails on your behalf', permissionSync: 'Sync your inbox to Omnexia', permissionCalendar: 'Calendar availability (optional)', connect: 'Connect Gmail', connecting: 'Connecting…', skipLink: 'You can connect Gmail later in Settings', connectedLabel: 'Connected!', connectedSub: 'Continuing automatically…' },
  s7: { heading: 'Choose your modules', subtitle: 'You can change this anytime in Settings.', required: 'Required', modules: [{ label: 'Communications', desc: 'Unified inbox — Gmail & more' }, { label: 'Finance', desc: 'Invoices & expenses' }, { label: 'Planning', desc: 'Team scheduling & time-off' }, { label: 'Team & Roles', desc: 'Manage your team' }] },
  s8: { heading: 'Invite your team', subtitle: "Send invite links to your colleagues. They'll join as employees.", placeholder: 'colleague@company.com', addBtn: 'Add', noTeammates: 'No teammates added yet. You can also do this later in Settings.', errInvalid: 'Enter a valid email address', errDuplicate: 'Already added' },
  s9: { heading: "You're all set!", subtitle: "Here's a summary of your Omnexia setup.", saving: 'Saving your workspace…', rowBusiness: 'Business', rowCountry: 'Country', rowIndustry: 'Industry', rowSize: 'Team size', rowGmail: 'Gmail', rowModules: 'Modules', rowInvites: 'Invites', gmailConnected: '✅ Connected', gmailSkipped: '⏭ Skipped', notSpecified: 'Not specified', inviteCount: (n) => `${n} invite(s) queued`, inviteNone: 'None', employeesSuffix: 'employees' },
}

const fr: OnboardingStrings = {
  stepOf: (s, t) => `ÉTAPE ${s} SUR ${t}`,
  stepLabels: ['LANGUE', 'ENTREPRISE', 'PAYS', 'SECTEUR', 'ÉQUIPE', 'GMAIL', 'MODULES', 'INVITER', 'TERMINÉ'],
  back: 'Retour', continue: 'Continuer', skip: 'Passer', getStarted: 'Commencer',
  s1: { heading: 'Bienvenue sur Omnexia', subtitle: 'Votre OS professionnel pour l\'Europe', selectPrompt: 'Sélectionnez votre langue pour commencer' },
  s2: { heading: 'Parlez-nous de votre entreprise', subtitle: 'Ces informations apparaîtront dans tout votre espace de travail.', businessName: 'Nom de l\'entreprise', businessNamePlaceholder: 'Dupont SAS', logo: 'Logo', logoOptional: '(optionnel)', uploadPrompt: 'Cliquez pour télécharger un logo', uploadHint: 'PNG, JPG, SVG — max 2 Mo', clickToChange: 'Cliquer pour changer' },
  s3: { heading: 'Où est basée votre entreprise ?', subtitle: 'Cela définit votre format TVA, devise et affichage des dates.', countryLabel: 'Pays / Région', countryPlaceholder: 'Sélectionner un pays…', vatRate: 'Taux de TVA (%)', currency: 'Devise', dateFormat: 'Format de date', vatFormat: 'Format du numéro de TVA', vatHint: 'Pré-rempli avec le format standard de votre pays. Vous pouvez le modifier.', requiredHint: 'Obligatoire — cela affecte les calculs de TVA dans toute l\'application.' },
  s4: { heading: 'Quel type d\'entreprise êtes-vous ?', subtitle: 'Sélectionnez l\'option qui décrit le mieux votre entreprise.', industries: [{ label: 'E-commerce', desc: 'Boutique en ligne ou marketplace' }, { label: 'Agence', desc: 'Agence créative, digitale ou média' }, { label: 'Conseil', desc: 'Services professionnels & conseil' }, { label: 'Commerce physique', desc: 'Magasins, restaurants, hôtellerie' }, { label: 'Autre', desc: 'Ne correspond pas aux options ci-dessus' }] },
  s5: { heading: 'Combien d\'employés avez-vous ?', subtitle: 'Cela nous aide à personnaliser votre expérience.', sizes: [{ desc: 'Petite équipe' }, { desc: 'Équipe en croissance' }, { desc: 'Entreprise moyenne' }] },
  s6: { heading: 'Connectez votre Gmail', subtitle: 'Synchronisez votre boîte de réception pour gérer toutes vos communications en un seul endroit.', permissionRead: 'Lire et envoyer des e-mails en votre nom', permissionSync: 'Synchroniser votre boîte avec Omnexia', permissionCalendar: 'Disponibilités du calendrier (optionnel)', connect: 'Connecter Gmail', connecting: 'Connexion…', skipLink: 'Vous pouvez connecter Gmail plus tard dans les Paramètres', connectedLabel: 'Connecté !', connectedSub: 'Passage automatique…' },
  s7: { heading: 'Choisissez vos modules', subtitle: 'Vous pouvez modifier cela à tout moment dans les Paramètres.', required: 'Requis', modules: [{ label: 'Communications', desc: 'Boîte unifiée — Gmail & plus' }, { label: 'Finance', desc: 'Factures & dépenses' }, { label: 'Planification', desc: 'Planning & congés' }, { label: 'Équipe & Rôles', desc: 'Gérer votre équipe' }] },
  s8: { heading: 'Invitez votre équipe', subtitle: 'Envoyez des liens d\'invitation à vos collègues. Ils rejoindront en tant qu\'employés.', placeholder: 'collegue@entreprise.com', addBtn: 'Ajouter', noTeammates: 'Aucun collègue ajouté pour l\'instant. Vous pouvez le faire plus tard dans les Paramètres.', errInvalid: 'Entrez une adresse e-mail valide', errDuplicate: 'Déjà ajouté' },
  s9: { heading: 'Tout est prêt !', subtitle: 'Voici un récapitulatif de votre configuration Omnexia.', saving: 'Enregistrement de votre espace…', rowBusiness: 'Entreprise', rowCountry: 'Pays', rowIndustry: 'Secteur', rowSize: 'Taille de l\'équipe', rowGmail: 'Gmail', rowModules: 'Modules', rowInvites: 'Invitations', gmailConnected: '✅ Connecté', gmailSkipped: '⏭ Ignoré', notSpecified: 'Non spécifié', inviteCount: (n) => `${n} invitation(s) en attente`, inviteNone: 'Aucune', employeesSuffix: 'employés' },
}

const de: OnboardingStrings = {
  stepOf: (s, t) => `SCHRITT ${s} VON ${t}`,
  stepLabels: ['SPRACHE', 'UNTERNEHMEN', 'LAND', 'BRANCHE', 'TEAMGRÖSSE', 'GMAIL', 'MODULE', 'EINLADEN', 'FERTIG'],
  back: 'Zurück', continue: 'Weiter', skip: 'Überspringen', getStarted: 'Loslegen',
  s1: { heading: 'Willkommen bei Omnexia', subtitle: 'Ihr professionelles OS für Europa', selectPrompt: 'Wählen Sie Ihre Sprache aus, um zu beginnen' },
  s2: { heading: 'Erzählen Sie uns von Ihrem Unternehmen', subtitle: 'Diese Informationen erscheinen in Ihrem gesamten Arbeitsbereich.', businessName: 'Unternehmensname', businessNamePlaceholder: 'Muster GmbH', logo: 'Logo', logoOptional: '(optional)', uploadPrompt: 'Klicken, um Logo hochzuladen', uploadHint: 'PNG, JPG, SVG — max. 2 MB', clickToChange: 'Klicken zum Ändern' },
  s3: { heading: 'Wo ist Ihr Unternehmen ansässig?', subtitle: 'Dies legt Ihr MwSt.-Format, Ihre Währung und die Datumsanzeige fest.', countryLabel: 'Land / Region', countryPlaceholder: 'Land auswählen…', vatRate: 'MwSt.-Satz (%)', currency: 'Währung', dateFormat: 'Datumsformat', vatFormat: 'Format der USt-IdNr.', vatHint: 'Vorausgefüllt mit dem Standardformat für Ihr Land. Sie können dies ändern.', requiredHint: 'Erforderlich — dies beeinflusst die MwSt.-Berechnungen in der gesamten App.' },
  s4: { heading: 'Was für ein Unternehmen sind Sie?', subtitle: 'Wählen Sie die Option, die Ihr Unternehmen am besten beschreibt.', industries: [{ label: 'E-Commerce', desc: 'Online-Shop oder Marktplatz' }, { label: 'Agentur', desc: 'Kreativ-, Digital- oder Medienagentur' }, { label: 'Beratung', desc: 'Professionelle Dienstleistungen & Beratung' }, { label: 'Stationärer Handel', desc: 'Geschäfte, Restaurants, Gastgewerbe' }, { label: 'Sonstiges', desc: 'Passt nicht zu den obigen Optionen' }] },
  s5: { heading: 'Wie viele Mitarbeiter haben Sie?', subtitle: 'Dies hilft uns, Ihre Erfahrung anzupassen.', sizes: [{ desc: 'Kleines Team' }, { desc: 'Wachsendes Team' }, { desc: 'Mittelständisches Unternehmen' }] },
  s6: { heading: 'Verbinden Sie Ihr Gmail', subtitle: 'Synchronisieren Sie Ihren Posteingang, um alle Kommunikationen an einem Ort zu verwalten.', permissionRead: 'E-Mails in Ihrem Namen lesen und senden', permissionSync: 'Ihren Posteingang mit Omnexia synchronisieren', permissionCalendar: 'Kalenderverfügbarkeit (optional)', connect: 'Gmail verbinden', connecting: 'Verbindung…', skipLink: 'Sie können Gmail später in den Einstellungen verbinden', connectedLabel: 'Verbunden!', connectedSub: 'Automatisch weiter…' },
  s7: { heading: 'Wählen Sie Ihre Module', subtitle: 'Sie können dies jederzeit in den Einstellungen ändern.', required: 'Erforderlich', modules: [{ label: 'Kommunikation', desc: 'Einheitlicher Posteingang — Gmail & mehr' }, { label: 'Finanzen', desc: 'Rechnungen & Ausgaben' }, { label: 'Planung', desc: 'Teamplanung & Urlaub' }, { label: 'Team & Rollen', desc: 'Ihr Team verwalten' }] },
  s8: { heading: 'Laden Sie Ihr Team ein', subtitle: 'Senden Sie Einladungslinks an Ihre Kollegen. Sie treten als Mitarbeiter bei.', placeholder: 'kollege@unternehmen.de', addBtn: 'Hinzufügen', noTeammates: 'Noch keine Teammitglieder hinzugefügt. Sie können dies auch später in den Einstellungen tun.', errInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein', errDuplicate: 'Bereits hinzugefügt' },
  s9: { heading: 'Alles bereit!', subtitle: 'Hier ist eine Zusammenfassung Ihrer Omnexia-Einrichtung.', saving: 'Arbeitsbereich wird gespeichert…', rowBusiness: 'Unternehmen', rowCountry: 'Land', rowIndustry: 'Branche', rowSize: 'Teamgröße', rowGmail: 'Gmail', rowModules: 'Module', rowInvites: 'Einladungen', gmailConnected: '✅ Verbunden', gmailSkipped: '⏭ Übersprungen', notSpecified: 'Nicht angegeben', inviteCount: (n) => `${n} Einladung(en) ausstehend`, inviteNone: 'Keine', employeesSuffix: 'Mitarbeiter' },
}

const es: OnboardingStrings = {
  stepOf: (s, t) => `PASO ${s} DE ${t}`,
  stepLabels: ['IDIOMA', 'EMPRESA', 'PAÍS', 'SECTOR', 'EQUIPO', 'GMAIL', 'MÓDULOS', 'INVITAR', 'LISTO'],
  back: 'Atrás', continue: 'Continuar', skip: 'Omitir', getStarted: 'Empezar',
  s1: { heading: 'Bienvenido a Omnexia', subtitle: 'Tu OS profesional para Europa', selectPrompt: 'Selecciona tu idioma para comenzar' },
  s2: { heading: 'Cuéntanos sobre tu empresa', subtitle: 'Esta información aparecerá en todo tu espacio de trabajo.', businessName: 'Nombre de la empresa', businessNamePlaceholder: 'Empresa S.L.', logo: 'Logo', logoOptional: '(opcional)', uploadPrompt: 'Haz clic para subir logo', uploadHint: 'PNG, JPG, SVG — máx. 2 MB', clickToChange: 'Clic para cambiar' },
  s3: { heading: '¿Dónde está ubicada tu empresa?', subtitle: 'Esto define tu formato de IVA, moneda y visualización de fechas.', countryLabel: 'País / Región', countryPlaceholder: 'Seleccionar un país…', vatRate: 'Tipo de IVA (%)', currency: 'Moneda', dateFormat: 'Formato de fecha', vatFormat: 'Formato del NIF/IVA', vatHint: 'Rellenado con el formato estándar de tu país. Puedes modificarlo.', requiredHint: 'Obligatorio — esto afecta a los cálculos de IVA en toda la app.' },
  s4: { heading: '¿Qué tipo de empresa eres?', subtitle: 'Selecciona la opción que mejor describe tu empresa.', industries: [{ label: 'E-commerce', desc: 'Tienda online o marketplace' }, { label: 'Agencia', desc: 'Agencia creativa, digital o de medios' }, { label: 'Consultoría', desc: 'Servicios profesionales & asesoría' }, { label: 'Comercio físico', desc: 'Tiendas, restaurantes, hostelería' }, { label: 'Otro', desc: 'No encaja en las opciones anteriores' }] },
  s5: { heading: '¿Cuántos empleados tienes?', subtitle: 'Esto nos ayuda a personalizar tu experiencia.', sizes: [{ desc: 'Equipo pequeño' }, { desc: 'Equipo en crecimiento' }, { desc: 'Empresa mediana' }] },
  s6: { heading: 'Conecta tu Gmail', subtitle: 'Sincroniza tu bandeja de entrada para gestionar todas tus comunicaciones en un lugar.', permissionRead: 'Leer y enviar correos en tu nombre', permissionSync: 'Sincronizar tu bandeja con Omnexia', permissionCalendar: 'Disponibilidad del calendario (opcional)', connect: 'Conectar Gmail', connecting: 'Conectando…', skipLink: 'Puedes conectar Gmail más tarde en Configuración', connectedLabel: '¡Conectado!', connectedSub: 'Continuando automáticamente…' },
  s7: { heading: 'Elige tus módulos', subtitle: 'Puedes cambiar esto en cualquier momento en Configuración.', required: 'Requerido', modules: [{ label: 'Comunicaciones', desc: 'Bandeja unificada — Gmail & más' }, { label: 'Finanzas', desc: 'Facturas & gastos' }, { label: 'Planificación', desc: 'Planificación del equipo & vacaciones' }, { label: 'Equipo & Roles', desc: 'Gestiona tu equipo' }] },
  s8: { heading: 'Invita a tu equipo', subtitle: 'Envía enlaces de invitación a tus compañeros. Se unirán como empleados.', placeholder: 'compañero@empresa.com', addBtn: 'Añadir', noTeammates: 'No hay compañeros añadidos aún. También puedes hacerlo más tarde en Configuración.', errInvalid: 'Introduce una dirección de correo válida', errDuplicate: 'Ya añadido' },
  s9: { heading: '¡Todo listo!', subtitle: 'Aquí tienes un resumen de tu configuración de Omnexia.', saving: 'Guardando tu espacio de trabajo…', rowBusiness: 'Empresa', rowCountry: 'País', rowIndustry: 'Sector', rowSize: 'Tamaño del equipo', rowGmail: 'Gmail', rowModules: 'Módulos', rowInvites: 'Invitaciones', gmailConnected: '✅ Conectado', gmailSkipped: '⏭ Omitido', notSpecified: 'No especificado', inviteCount: (n) => `${n} invitación(es) pendiente(s)`, inviteNone: 'Ninguna', employeesSuffix: 'empleados' },
}

const it: OnboardingStrings = {
  stepOf: (s, t) => `FASE ${s} DI ${t}`,
  stepLabels: ['LINGUA', 'AZIENDA', 'PAESE', 'SETTORE', 'TEAM', 'GMAIL', 'MODULI', 'INVITA', 'FATTO'],
  back: 'Indietro', continue: 'Continua', skip: 'Salta', getStarted: 'Inizia',
  s1: { heading: 'Benvenuto su Omnexia', subtitle: 'Il tuo OS professionale per l\'Europa', selectPrompt: 'Seleziona la tua lingua per iniziare' },
  s2: { heading: 'Raccontaci della tua azienda', subtitle: 'Queste informazioni appariranno in tutto il tuo spazio di lavoro.', businessName: 'Nome dell\'azienda', businessNamePlaceholder: 'Rossi S.r.l.', logo: 'Logo', logoOptional: '(opzionale)', uploadPrompt: 'Clicca per caricare il logo', uploadHint: 'PNG, JPG, SVG — max 2 MB', clickToChange: 'Clicca per cambiare' },
  s3: { heading: 'Dove ha sede la tua azienda?', subtitle: 'Questo imposta il formato IVA, la valuta e la visualizzazione delle date.', countryLabel: 'Paese / Regione', countryPlaceholder: 'Seleziona un paese…', vatRate: 'Aliquota IVA (%)', currency: 'Valuta', dateFormat: 'Formato data', vatFormat: 'Formato numero IVA', vatHint: 'Pre-compilato con il formato standard del tuo paese. Puoi modificarlo.', requiredHint: 'Obbligatorio — questo influisce sui calcoli IVA in tutta l\'app.' },
  s4: { heading: 'Che tipo di azienda sei?', subtitle: 'Seleziona l\'opzione che descrive meglio la tua azienda.', industries: [{ label: 'E-commerce', desc: 'Negozio online o marketplace' }, { label: 'Agenzia', desc: 'Agenzia creativa, digitale o media' }, { label: 'Consulenza', desc: 'Servizi professionali & consulenza' }, { label: 'Commercio fisico', desc: 'Negozi, ristoranti, ospitalità' }, { label: 'Altro', desc: 'Non rientra nelle opzioni precedenti' }] },
  s5: { heading: 'Quanti dipendenti hai?', subtitle: 'Questo ci aiuta a personalizzare la tua esperienza.', sizes: [{ desc: 'Team piccolo' }, { desc: 'Team in crescita' }, { desc: 'Impresa media' }] },
  s6: { heading: 'Collega il tuo Gmail', subtitle: 'Sincronizza la tua casella di posta per gestire tutte le comunicazioni in un unico posto.', permissionRead: 'Leggere e inviare email a tuo nome', permissionSync: 'Sincronizzare la tua casella con Omnexia', permissionCalendar: 'Disponibilità calendario (opzionale)', connect: 'Collega Gmail', connecting: 'Connessione…', skipLink: 'Puoi collegare Gmail più tardi nelle Impostazioni', connectedLabel: 'Collegato!', connectedSub: 'Continuando automaticamente…' },
  s7: { heading: 'Scegli i tuoi moduli', subtitle: 'Puoi modificare questo in qualsiasi momento nelle Impostazioni.', required: 'Richiesto', modules: [{ label: 'Comunicazioni', desc: 'Casella unificata — Gmail & altro' }, { label: 'Finanza', desc: 'Fatture & spese' }, { label: 'Pianificazione', desc: 'Pianificazione team & ferie' }, { label: 'Team & Ruoli', desc: 'Gestisci il tuo team' }] },
  s8: { heading: 'Invita il tuo team', subtitle: 'Invia link di invito ai tuoi colleghi. Si unirannno come dipendenti.', placeholder: 'collega@azienda.it', addBtn: 'Aggiungi', noTeammates: 'Nessun collega aggiunto ancora. Puoi farlo anche più tardi nelle Impostazioni.', errInvalid: 'Inserisci un indirizzo email valido', errDuplicate: 'Già aggiunto' },
  s9: { heading: 'Tutto pronto!', subtitle: 'Ecco un riepilogo della tua configurazione Omnexia.', saving: 'Salvataggio del tuo spazio…', rowBusiness: 'Azienda', rowCountry: 'Paese', rowIndustry: 'Settore', rowSize: 'Dimensione team', rowGmail: 'Gmail', rowModules: 'Moduli', rowInvites: 'Inviti', gmailConnected: '✅ Collegato', gmailSkipped: '⏭ Saltato', notSpecified: 'Non specificato', inviteCount: (n) => `${n} invito/i in coda`, inviteNone: 'Nessuno', employeesSuffix: 'dipendenti' },
}

const nl: OnboardingStrings = {
  stepOf: (s, t) => `STAP ${s} VAN ${t}`,
  stepLabels: ['TAAL', 'BEDRIJF', 'LAND', 'SECTOR', 'TEAMGROOTTE', 'GMAIL', 'MODULES', 'UITNODIGEN', 'KLAAR'],
  back: 'Terug', continue: 'Doorgaan', skip: 'Overslaan', getStarted: 'Aan de slag',
  s1: { heading: 'Welkom bij Omnexia', subtitle: 'Uw professioneel OS voor Europa', selectPrompt: 'Selecteer uw taal om te beginnen' },
  s2: { heading: 'Vertel ons over uw bedrijf', subtitle: 'Deze informatie verschijnt in uw hele werkruimte.', businessName: 'Bedrijfsnaam', businessNamePlaceholder: 'Jansen B.V.', logo: 'Logo', logoOptional: '(optioneel)', uploadPrompt: 'Klik om logo te uploaden', uploadHint: 'PNG, JPG, SVG — max. 2 MB', clickToChange: 'Klik om te wijzigen' },
  s3: { heading: 'Waar is uw bedrijf gevestigd?', subtitle: 'Dit bepaalt uw btw-indeling, valuta en datumweergave.', countryLabel: 'Land / Regio', countryPlaceholder: 'Selecteer een land…', vatRate: 'Btw-tarief (%)', currency: 'Valuta', dateFormat: 'Datumnotatie', vatFormat: 'Formaat btw-nummer', vatHint: 'Vooraf ingevuld met het standaardformaat voor uw land. U kunt dit aanpassen.', requiredHint: 'Verplicht — dit beïnvloedt de btw-berekeningen in de hele app.' },
  s4: { heading: 'Wat voor soort bedrijf bent u?', subtitle: 'Selecteer de optie die uw bedrijf het beste beschrijft.', industries: [{ label: 'E-commerce', desc: 'Online winkel of marktplaats' }, { label: 'Bureau', desc: 'Creatief, digitaal of mediabureau' }, { label: 'Advies', desc: 'Professionele diensten & advies' }, { label: 'Fysieke detailhandel', desc: 'Winkels, restaurants, horeca' }, { label: 'Overig', desc: 'Past niet bij de bovenstaande opties' }] },
  s5: { heading: 'Hoeveel werknemers heeft u?', subtitle: 'Dit helpt ons uw ervaring op maat te maken.', sizes: [{ desc: 'Klein team' }, { desc: 'Groeiend team' }, { desc: 'Middelgroot bedrijf' }] },
  s6: { heading: 'Verbind uw Gmail', subtitle: 'Synchroniseer uw inbox om alle communicatie op één plek te beheren.', permissionRead: 'E-mails namens u lezen en verzenden', permissionSync: 'Uw inbox synchroniseren met Omnexia', permissionCalendar: 'Agendabeschikbaarheid (optioneel)', connect: 'Gmail verbinden', connecting: 'Verbinden…', skipLink: 'U kunt Gmail later verbinden via Instellingen', connectedLabel: 'Verbonden!', connectedSub: 'Automatisch verdergaan…' },
  s7: { heading: 'Kies uw modules', subtitle: 'U kunt dit altijd wijzigen in Instellingen.', required: 'Vereist', modules: [{ label: 'Communicatie', desc: 'Uniforme inbox — Gmail & meer' }, { label: 'Financiën', desc: 'Facturen & uitgaven' }, { label: 'Planning', desc: 'Teamplanning & verlof' }, { label: 'Team & Rollen', desc: 'Beheer uw team' }] },
  s8: { heading: 'Nodig uw team uit', subtitle: 'Stuur uitnodigingslinks naar uw collega\'s. Ze worden toegevoegd als medewerkers.', placeholder: 'collega@bedrijf.nl', addBtn: 'Toevoegen', noTeammates: 'Nog geen teamleden toegevoegd. U kunt dit ook later doen via Instellingen.', errInvalid: 'Voer een geldig e-mailadres in', errDuplicate: 'Al toegevoegd' },
  s9: { heading: 'U bent klaar!', subtitle: 'Hier is een overzicht van uw Omnexia-configuratie.', saving: 'Werkruimte opslaan…', rowBusiness: 'Bedrijf', rowCountry: 'Land', rowIndustry: 'Sector', rowSize: 'Teamgrootte', rowGmail: 'Gmail', rowModules: 'Modules', rowInvites: 'Uitnodigingen', gmailConnected: '✅ Verbonden', gmailSkipped: '⏭ Overgeslagen', notSpecified: 'Niet opgegeven', inviteCount: (n) => `${n} uitnodiging(en) in wachtrij`, inviteNone: 'Geen', employeesSuffix: 'medewerkers' },
}

export const TRANSLATIONS: Record<Locale, OnboardingStrings> = { en, fr, de, es, it, nl }
