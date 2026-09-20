'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export type Language = 'en' | 'nb' | 'es'

export function localeFor(language: Language): string {
  return language === 'nb' ? 'nb-NO' : language === 'es' ? 'es-ES' : 'en-GB'
}

const norwegian: Record<string, string> = {
  'Privacy Policy': 'Personvernerklæring',
  'Last updated: June 2026': 'Sist oppdatert: juni 2026',
  '1. Introduction': '1. Innledning',
  '2. Information We Collect': '2. Informasjon vi samler inn',
  '3. How We Use Your Information': '3. Hvordan vi bruker informasjonen din',
  '4. Who Can See Your Data': '4. Hvem kan se opplysningene dine',
  '5. Data Storage and Security': '5. Datalagring og sikkerhet',
  '6. Data Retention': '6. Lagringstid',
  '7. Your Rights': '7. Dine rettigheter',
  "8. Children's Privacy": '8. Barns personvern',
  '9. Changes to This Policy': '9. Endringer i erklæringen',
  '10. Contact Us': '10. Kontakt oss',
  'Account Information': 'Kontoinformasjon',
  'Profile Information': 'Profilinformasjon',
  'Workout Data': 'Treningsdata',
  'App Preferences': 'Appinnstillinger',
  'As a Client': 'Som kunde',
  'As a Personal Trainer': 'Som personlig trener',
  'We collect the following types of information:': 'Vi samler inn følgende typer informasjon:',
  'Display name, role (personal trainer or client), preferred language.': 'Visningsnavn, rolle (personlig trener eller kunde) og foretrukket språk.',
  'Exercises logged, sets, repetitions, weights, workout dates and personal records.': 'Registrerte øvelser, sett, repetisjoner, vekter, treningsdatoer og personlige rekorder.',
  'Plans assigned by your personal trainer including exercises, sets, reps and PT notes.': 'Planer tildelt av din personlige trener, inkludert øvelser, sett, repetisjoner og PT-notater.',
  'Weight, body measurements and other fitness metrics entered by your personal trainer.': 'Vekt, kroppsmål og andre treningsmålinger registrert av din personlige trener.',
  'Under GDPR you have the right to:': 'I henhold til GDPR har du rett til å:',
  'If you have questions about this Privacy Policy or want to exercise your rights, contact us at:': 'Hvis du har spørsmål om personvernerklæringen eller vil benytte rettighetene dine, kan du kontakte oss på:',
  'Trondheim, Norway': 'Trondheim, Norge',
  'All rights reserved.': 'Alle rettigheter forbeholdt.',
  '(optional)': '(valgfritt)',
  'Active': 'Aktiv',
  'Active Plan': 'Aktiv plan',
  'Active Plans': 'Aktive planer',
  'Actual': 'Utført',
  'Add Client': 'Legg til kunde',
  'Add Day': 'Legg til dag',
  'Add Exercise': 'Legg til øvelse',
  'Add days and exercises for each session.': 'Legg til dager og øvelser for hver økt.',
  'All': 'Alle',
  'Advanced': 'Avansert',
  'Assign to Client': 'Tildel til kunde',
  'Assign Template to Client': 'Tildel mal til kunde',
  'Assigning...': 'Tildeler …',
  'Already have an account?': 'Har du allerede en konto?',
  'Assign': 'Tildel',
  'Assign Template': 'Tildel mal',
  'Assignment Details': 'Detaljer for tildeling',
  'Back': 'Tilbake',
  'Back to clients': 'Tilbake til kunder',
  'Back to plans': 'Tilbake til planer',
  'Back to templates': 'Tilbake til maler',
  'Beginner': 'Nybegynner',
  'BETTER TOMORROW.': 'BEDRE I MORGEN.',
  'Body Metrics (optional)': 'Kroppsmål (valgfritt)',
  'Build a training plan': 'Lag en treningsplan',
  'Built for personal trainers.': 'Laget for personlige trenere.',
  'Cancel': 'Avbryt',
  'Cardio': 'Kondisjon',
  'Category': 'Kategori',
  'Check everything looks good before saving.': 'Kontroller at alt ser riktig ut før du lagrer.',
  'Check your email to confirm your account!': 'Sjekk e-posten din for å bekrefte kontoen!',
  'Client': 'Kunde',
  'Client & Details': 'Kunde og detaljer',
  'Client *': 'Kunde *',
  'Client not found': 'Fant ikke kunden',
  'Clients': 'Kunder',
  'Complete': 'Fullført',
  'Completed': 'Fullført',
  'Copied!': 'Kopiert!',
  'Copy': 'Kopier',
  'Create Account': 'Opprett konto',
  'Create Plan': 'Opprett plan',
  'Create Template': 'Opprett mal',
  'Create a training plan': 'Opprett en treningsplan',
  'Create account': 'Opprett konto',
  'Create reusable training templates and assign them to any client with one click.': 'Lag gjenbrukbare treningsmaler og tildel dem til kunder med ett klikk.',
  'Dark mode and text size preferences stored locally on your device.': 'Mørk modus og tekststørrelse lagres lokalt på enheten din.',
  'Days': 'Dager',
  'days completed': 'dager fullført',
  'Delete': 'Slett',
  'Delete plan?': 'Slette planen?',
  'Delete template?': 'Slette malen?',
  'Description': 'Beskrivelse',
  'Difficulty': 'Vanskelighetsgrad',
  "Don't have an account?": 'Har du ikke en konto?',
  'Edit': 'Rediger',
  'Edit Template': 'Rediger mal',
  'Email address and password when you create an account.': 'E-postadresse og passord når du oppretter en konto.',
  'Exercise': 'Øvelse',
  'Exercises': 'Øvelser',
  'Exercises/Day': 'Øvelser/dag',
  'Generate an invite code': 'Generer en invitasjonskode',
  'Generate First Invite Code': 'Generer din første invitasjonskode',
  'Generating...': 'Genererer …',
  "Here's what's happening with your clients today.": 'Her er det som skjer med kundene dine i dag.',
  'Invite code': 'Invitasjonskode',
  'Invite Client': 'Inviter kunde',
  'Inactive': 'Inaktiv',
  'Intermediate': 'Viderekommen',
  'Loading...': 'Laster …',
  'Map Days to Weekdays': 'Koble dager til ukedager',
  'Name *': 'Navn *',
  'New Plan': 'Ny plan',
  'New Template': 'Ny mal',
  'New Training Plan': 'Ny treningsplan',
  'Next': 'Neste',
  'No category': 'Ingen kategori',
  'No client': 'Ingen kunde',
  'No active plan': 'Ingen aktiv plan',
  'No clients yet': 'Ingen kunder ennå',
  'No exercises added': 'Ingen øvelser lagt til',
  'No plans yet': 'Ingen planer ennå',
  'No templates yet': 'Ingen maler ennå',
  'Not logged': 'Ikke registrert',
  'Not started': 'Ikke startet',
  'Notes': 'Notater',
  'Notes for client': 'Notater til kunden',
  'Password': 'Passord',
  'Plan Details': 'Plandetaljer',
  'Plan Title': 'Plantittel',
  'Plan Title *': 'Plantittel *',
  'Plan not found': 'Fant ikke planen',
  'Planned': 'Planlagt',
  'Plans': 'Planer',
  'Previous': 'Forrige',
  'Previous Plans': 'Tidligere planer',
  'Private': 'Privat',
  'Public': 'Offentlig',
  'Quick Actions': 'Hurtighandlinger',
  'Remove': 'Fjern',
  'Rest': 'Pause',
  'Rest sec': 'Pause sek',
  'Reps max': 'Maks reps',
  'Reps min': 'Min reps',
  'Review & Save': 'Se gjennom og lagre',
  'Save': 'Lagre',
  'Save Changes': 'Lagre endringer',
  'Save Plan ✓': 'Lagre plan ✓',
  'Save Template': 'Lagre mal',
  'Save Template ✓': 'Lagre mal ✓',
  'Save Training Plan': 'Lagre treningsplan',
  'Saving...': 'Lagrer …',
  'See all training plans': 'Se alle treningsplaner',
  'Select Exercise': 'Velg øvelse',
  'Select a client...': 'Velg en kunde …',
  'Select...': 'Velg …',
  'Sets': 'Sett',
  'Sets × Reps': 'Sett × repetisjoner',
  'Sign In →': 'Logg inn →',
  'Sign in': 'Logg inn',
  'Sign in to your PT dashboard': 'Logg inn på PT-dashbordet ditt',
  'Sign out': 'Logg ut',
  'Sign up': 'Registrer deg',
  'Skipped': 'Hoppet over',
  'Start managing your clients today': 'Begynn å følge opp kundene dine i dag',
  'Status': 'Status',
  'Strength': 'Styrke',
  'STRONGER TODAY.': 'STERKERE I DAG.',
  'Template': 'Mal',
  'Template Details': 'Maldetaljer',
  'Template not found': 'Fant ikke malen',
  'Templates': 'Maler',
  'The smartest way to manage your clients,': 'Den smarteste måten å følge opp kundene dine,',
  'track progress and deliver results.': 'måle fremgang og skape resultater.',
  'The smartest way to manage your clients and deliver results.': 'Den smarteste måten å følge opp kundene dine og skape resultater.',
  'Total Clients': 'Totalt antall kunder',
  'Total Exercises': 'Totalt antall øvelser',
  'Training Days': 'Treningsdager',
  'Training Plans': 'Treningsplaner',
  'View': 'Vis',
  'View Plans': 'Vis planer',
  'View plan →': 'Vis plan →',
  'View →': 'Vis →',
  'Visibility': 'Synlighet',
  'Waiting for client...': 'Venter på kunden …',
  'Week Start': 'Ukestart',
  'Week Start *': 'Ukestart *',
  'Week Start Date *': 'Startdato for uken *',
  'Weekly Progress': 'Ukentlig fremgang',
  'Weight': 'Vekt',
  'Weight kg': 'Vekt kg',
  'Yesterday': 'I går',
  'Today': 'I dag',
  'Unknown': 'Ukjent',
  'Unknown client': 'Ukjent kunde',
  'Duplicate': 'Dupliser',
  'Duplicate week': 'Dupliser uke',
  'Flexibility': 'Bevegelighet',
  'Hypertrophy': 'Hypertrofi',
  'Rehabilitation': 'Rehabilitering',
  'Weight Loss': 'Vektnedgang',
  'Please add a template name.': 'Legg til et navn på malen.',
  'Please fill in all required fields.': 'Fyll ut alle obligatoriske felt.',
  'Something went wrong.': 'Noe gikk galt.',
  'Search exercises...': 'Søk etter øvelser …',
  'Day name': 'Navn på dag',
  'Focus (e.g. Chest)': 'Fokus (f.eks. bryst)',
  'Instructions or focus for this week...': 'Instruksjoner eller fokus for denne uken …',
  'PT note (optional)': 'PT-notat (valgfritt)',
  'PT note for client (optional)': 'PT-notat til kunden (valgfritt)',
  'What is this template for?': 'Hva skal denne malen brukes til?',
  'e.g. Beginner 3 Day Split': 'f.eks. 3-dagers nybegynnerprogram',
  'e.g. Week 1 — Strength Foundation': 'f.eks. uke 1 – grunnleggende styrke',
  'Welcome back': 'Velkommen tilbake',
  'Welcome back 👋': 'Velkommen tilbake 👋',
  'Who is this plan for and when does it start?': 'Hvem er planen for, og når starter den?',
  'Toggle theme': 'Bytt tema',
  'Week of': 'Uke',
  'Drop exercises here or click + Add Exercise': 'Slipp øvelser her eller klikk på + Legg til øvelse',

  // Public privacy and account-deletion pages
  'Guidance PT ("we", "our", or "us") is a personal training platform that connects personal trainers with their clients. This Privacy Policy explains how we collect, use and protect your personal information when you use our Android app or web dashboard.': 'Guidance PT ("vi", "oss" eller "vår") er en plattform for personlig trening som kobler personlige trenere med kundene sine. Denne personvernerklæringen forklarer hvordan vi samler inn, bruker og beskytter personopplysningene dine når du bruker Android-appen eller nettbasert dashbord.',
  'By using Guidance PT you agree to the collection and use of information as described in this policy.': 'Ved å bruke Guidance PT samtykker du til innsamling og bruk av informasjon slik det er beskrevet i denne erklæringen.',
  'To provide and operate the Guidance PT service': 'Å levere og drifte Guidance PT-tjenesten',
  'To connect clients with their personal trainer': 'Å koble kunder med sin personlige trener',
  'To display training plans and track workout progress': 'Å vise treningsplaner og følge treningsfremgang',
  'To calculate and display personal records and statistics': 'Å beregne og vise personlige rekorder og statistikk',
  'To allow personal trainers to monitor client progress': 'Å la personlige trenere følge kundens fremgang',
  'To improve the app based on usage patterns': 'Å forbedre appen basert på bruksmønstre',
  'Your personal trainer can see your training plans, logged workouts and body metrics. Other users cannot see your data.': 'Din personlige trener kan se treningsplanene dine, registrerte treningsøkter og kroppsmål. Andre brukere kan ikke se dataene dine.',
  "You can only see data from clients who have connected to you using your invite code. You cannot see data from other trainers' clients.": 'Du kan bare se data fra kunder som har koblet seg til deg med invitasjonskoden din. Du kan ikke se data fra andre treneres kunder.',
  'Your data is stored securely using': 'Dataene dine lagres sikkert ved hjelp av',
  'a cloud database provider with enterprise-grade security. We use Row Level Security (RLS) to ensure users can only access their own data.': 'en skydatabaseleverandør med sikkerhet på bedriftsnivå. Vi bruker Row Level Security (RLS) for å sikre at brukere bare har tilgang til sine egne data.',
  'All data is encrypted in transit using HTTPS/TLS. We do not sell your personal data to third parties.': 'Alle data krypteres under overføring med HTTPS/TLS. Vi selger ikke personopplysningene dine til tredjeparter.',
  'We retain your data for as long as your account is active. If you delete your account, your personal data will be removed from our systems within 30 days.': 'Vi beholder dataene dine så lenge kontoen din er aktiv. Hvis du sletter kontoen din, fjernes personopplysningene dine fra systemene våre innen 30 dager.',
  'Access the personal data we hold about you': 'Få tilgang til personopplysningene vi har om deg',
  'Request correction of inaccurate data': 'Be om retting av uriktige data',
  'Request deletion of your account and data': 'Be om sletting av kontoen og dataene dine',
  'Object to processing of your data': 'Protestere mot behandlingen av dataene dine',
  'Data portability — receive your data in a readable format': 'Dataportabilitet – motta dataene dine i et lesbart format',
  'Guidance PT is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.': 'Guidance PT er ikke beregnet for barn under 16 år. Vi samler ikke bevisst inn personopplysninger fra barn under 16 år.',
  'We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.': 'Vi kan oppdatere denne personvernerklæringen fra tid til annen. Vi varsler brukerne om vesentlige endringer via e-post eller varsling i appen. Fortsatt bruk av appen etter endringer innebærer at du godtar den oppdaterte erklæringen.',
  '© 2026 Guidance PT. All rights reserved.': '© 2026 Guidance PT. Alle rettigheter forbeholdt.',
  'Delete Your Account': 'Slett kontoen din',
  'You can request permanent deletion of your Guidance PT account and all associated data at any time.': 'Du kan når som helst be om permanent sletting av Guidance PT-kontoen din og alle tilknyttede data.',
  'How to request deletion': 'Slik ber du om sletting',
  '1. Send an email': '1. Send en e-post',
  'to': 'til',
  'with the subject line "Delete my Guidance PT account".': 'med emnefeltet «Slett min Guidance PT-konto».',
  '2. Include the email address': '2. Oppgi e-postadressen',
  'associated with your account, so we can verify and locate it.': 'som er knyttet til kontoen din, slik at vi kan bekrefte og finne den.',
  '3. We will process your request': '3. Vi behandler forespørselen din',
  'and permanently delete your account and data within 30 days, and confirm by email once complete.': 'og sletter kontoen og dataene dine permanent innen 30 dager. Du får en bekreftelse på e-post når det er fullført.',
  'What gets deleted': 'Hva som slettes',
  'Your profile and login credentials': 'Profilen din og innloggingsopplysningene dine',
  'All logged workouts and exercise history': 'Alle registrerte treningsøkter og treningshistorikk',
  'Training plans assigned to you (or, if you are a PT, created by you)': 'Treningsplaner som er tildelt deg (eller, hvis du er PT, opprettet av deg)',
  'Body weight and other tracked metrics': 'Kroppsvekt og andre registrerte målinger',
  'Your connection to any personal trainer or client': 'Tilknytningen din til en personlig trener eller kunde',
  'Note:': 'Merk:',
  'See also our': 'Se også',

  // Training progress
  'My Training': 'Min trening',
  'Progress': 'Fremgang',
  'Current Streak': 'Pågående treningsrekke',
  'Longest Streak': 'Lengste treningsrekke',
  'Weekly Consistency': 'Treningskontinuitet',
  'Biggest Improvement': 'Største fremgang',
  'Most Trained Muscle Group': 'Mest trente muskelgruppe',
  'Best Training Week': 'Beste treningsuke',
  'Personal Records': 'Personlige rekorder',
  'Not enough data yet': 'Ikke nok data ennå',
  'No training history yet': 'Ingen treningshistorikk ennå',
  'Log a workout in the app to see your progress here.': 'Logg en treningsøkt i appen for å se fremgangen din her.',
  "hasn't logged any completed sets yet": 'har ikke registrert noen fullførte sett ennå',
  'sessions': 'økter',
  'sets logged': 'sett registrert',
  'chest': 'bryst',
  'back': 'rygg',
  'legs': 'bein',
  'core': 'kjerne',
  'shoulders': 'skuldre',
  'arms': 'armer',
  'glutes': 'setemuskler',
  'cardio': 'kondisjon',
  'full_body': 'hele kroppen',

  // Client pages
  'Active Clients': 'Aktive kunder',
  'Pending Invites': 'Ventende invitasjoner',
  'Revoked / Expired': 'Tilbakekalt / utløpt',
  'Revoked': 'Tilbakekalt',
  'Pending': 'Venter',
  'Revoke Code': 'Tilbakekall kode',
  'Active ✅': 'Aktiv ✅',
  'View Plans & Progress →': 'Vis planer og fremgang →',
  'Generate an invite code and share it with your first client to get started.': 'Generer en invitasjonskode og del den med din første kunde for å komme i gang.',
  'skipped': 'hoppet over',
  'completed': 'fullført',
  '0% logged': '0 % registrert',
  'mon': 'man', 'tue': 'tir', 'wed': 'ons', 'thu': 'tor', 'fri': 'fre', 'sat': 'lør', 'sun': 'søn',
  'monday': 'mandag', 'tuesday': 'tirsdag', 'wednesday': 'onsdag', 'thursday': 'torsdag',
  'friday': 'fredag', 'saturday': 'lørdag', 'sunday': 'søndag',
  'Set': 'Sett',
}

const spanish: Record<string, string> = {
  'Sign out': 'Cerrar sesión',
  'Welcome back': 'Bienvenido de nuevo',
  'Welcome back 👋': 'Bienvenido de nuevo 👋',
  "Here's what's happening with your clients today.": 'Esto es lo que está pasando hoy con tus clientes.',
  'STRONGER TODAY.': 'MÁS FUERTE HOY.',
  'BETTER TOMORROW.': 'MEJOR MAÑANA.',
  'The smartest way to manage your clients and deliver results.': 'La forma más inteligente de gestionar a tus clientes y conseguir resultados.',
  'The smartest way to manage your clients,': 'La forma más inteligente de gestionar a tus clientes,',
  'track progress and deliver results.': 'medir el progreso y conseguir resultados.',
  'Total Clients': 'Total de clientes',
  'Active Plans': 'Planes activos',
  'Templates': 'Plantillas',
  'View': 'Ver',
  'View →': 'Ver →',
  'View Plans': 'Ver planes',
  'View plan →': 'Ver plan →',
  'Toggle theme': 'Cambiar tema',
  'Loading...': 'Cargando …',
  'Clients': 'Clientes',
  'Plans': 'Planes',
  'New Plan': 'Nuevo plan',
  'New Template': 'Nueva plantilla',
  'Quick Actions': 'Acciones rápidas',
  'Add Client': 'Añadir cliente',
  'Generate an invite code': 'Genera un código de invitación',
  'Create Plan': 'Crear plan',
  'Build a training plan': 'Crea un plan de entrenamiento',
  'See all training plans': 'Ver todos los planes de entrenamiento',
  'Create a training plan': 'Crea un plan de entrenamiento',

  // Training progress
  'My Training': 'Mi entrenamiento',
  'Progress': 'Progreso',
  'Current Streak': 'Racha actual',
  'Longest Streak': 'Racha más larga',
  'Weekly Consistency': 'Constancia semanal',
  'Biggest Improvement': 'Mayor progreso',
  'Most Trained Muscle Group': 'Grupo muscular más entrenado',
  'Best Training Week': 'Mejor semana de entrenamiento',
  'Personal Records': 'Récords personales',
  'Not enough data yet': 'Aún no hay suficientes datos',
  'No training history yet': 'Aún no hay historial de entrenamiento',
  'Log a workout in the app to see your progress here.': 'Registra un entrenamiento en la app para ver tu progreso aquí.',
  "hasn't logged any completed sets yet": 'aún no ha registrado ninguna serie completada',
  'sessions': 'sesiones',
  'sets logged': 'series registradas',
  'chest': 'pecho',
  'back': 'espalda',
  'legs': 'piernas',
  'core': 'núcleo',
  'shoulders': 'hombros',
  'arms': 'brazos',
  'glutes': 'glúteos',
  'cardio': 'cardio',
  'full_body': 'cuerpo completo',

  // Client pages
  'Back': 'Volver',
  'Back to clients': 'Volver a clientes',
  'Active Plan': 'Plan activo',
  'Weekly Progress': 'Progreso semanal',
  'days completed': 'días completados',
  'Skipped': 'Omitido',
  'Not started': 'No iniciado',
  'Completed': 'Completado',
  'Exercise': 'Ejercicio',
  'Planned': 'Planificado',
  'Actual': 'Realizado',
  'Status': 'Estado',
  'Not logged': 'No registrado',
  'Client not found': 'Cliente no encontrado',
  'No active plan': 'No hay plan activo',
  'Previous Plans': 'Planes anteriores',
  'Invite code': 'Código de invitación',
  'Invite Client': 'Invitar cliente',
  'No clients yet': 'Aún no hay clientes',
  'Generating...': 'Generando …',
  'Generate First Invite Code': 'Genera tu primer código de invitación',
  'Copy': 'Copiar',
  'Copied!': '¡Copiado!',
  'Waiting for client...': 'Esperando al cliente…',
  'Active Clients': 'Clientes activos',
  'Pending Invites': 'Invitaciones pendientes',
  'Revoked / Expired': 'Revocado / caducado',
  'Revoked': 'Revocado',
  'Pending': 'Pendiente',
  'Revoke Code': 'Revocar código',
  'Active ✅': 'Activo ✅',
  'View Plans & Progress →': 'Ver planes y progreso →',
  'Generate an invite code and share it with your first client to get started.': 'Genera un código de invitación y compártelo con tu primer cliente para empezar.',
  'skipped': 'omitido',
  'completed': 'completado',
  '0% logged': '0 % registrado',
  'mon': 'lun', 'tue': 'mar', 'wed': 'mié', 'thu': 'jue', 'fri': 'vie', 'sat': 'sáb', 'sun': 'dom',
  'monday': 'lunes', 'tuesday': 'martes', 'wednesday': 'miércoles', 'thursday': 'jueves',
  'friday': 'viernes', 'saturday': 'sábado', 'sunday': 'domingo',
  'Set': 'Serie',
  'Week of': 'Semana del',
  'Drop exercises here or click + Add Exercise': 'Suelta los ejercicios aquí o haz clic en + Añadir ejercicio',
}

// Keep Spanish at parity with the established Norwegian interface.  These
// phrases are also picked up by the DOM translator on pages that do not call
// `t()` directly (including the public policy pages).
Object.assign(spanish, {
  'Privacy Policy': 'Política de privacidad', 'Last updated: June 2026': 'Última actualización: junio de 2026',
  '1. Introduction': '1. Introducción', '2. Information We Collect': '2. Información que recopilamos', '3. How We Use Your Information': '3. Cómo usamos tu información', '4. Who Can See Your Data': '4. Quién puede ver tus datos', '5. Data Storage and Security': '5. Almacenamiento y seguridad de los datos', '6. Data Retention': '6. Conservación de los datos', '7. Your Rights': '7. Tus derechos', "8. Children's Privacy": '8. Privacidad de los menores', '9. Changes to This Policy': '9. Cambios en esta política', '10. Contact Us': '10. Contacto',
  'Account Information': 'Información de la cuenta', 'Profile Information': 'Información del perfil', 'Workout Data': 'Datos de entrenamiento', 'App Preferences': 'Preferencias de la aplicación', 'As a Client': 'Como cliente', 'As a Personal Trainer': 'Como entrenador personal', 'We collect the following types of information:': 'Recopilamos los siguientes tipos de información:', 'Display name, role (personal trainer or client), preferred language.': 'Nombre visible, rol (entrenador personal o cliente) e idioma preferido.', 'Exercises logged, sets, repetitions, weights, workout dates and personal records.': 'Ejercicios registrados, series, repeticiones, pesos, fechas de entrenamiento y récords personales.', 'Plans assigned by your personal trainer including exercises, sets, reps and PT notes.': 'Planes asignados por tu entrenador personal, incluidos ejercicios, series, repeticiones y notas del entrenador.', 'Weight, body measurements and other fitness metrics entered by your personal trainer.': 'Peso, medidas corporales y otras métricas de fitness registradas por tu entrenador personal.', 'Under GDPR you have the right to:': 'Según el RGPD, tienes derecho a:', 'If you have questions about this Privacy Policy or want to exercise your rights, contact us at:': 'Si tienes preguntas sobre esta Política de privacidad o quieres ejercer tus derechos, contáctanos en:', 'Trondheim, Norway': 'Trondheim, Noruega', 'All rights reserved.': 'Todos los derechos reservados.',
  '(optional)': '(opcional)', 'Active': 'Activo', 'Add Day': 'Añadir día', 'Add Exercise': 'Añadir ejercicio', 'Add days and exercises for each session.': 'Añade días y ejercicios para cada sesión.', 'All': 'Todos', 'Advanced': 'Avanzado', 'Assign to Client': 'Asignar a cliente', 'Assign Template to Client': 'Asignar plantilla a cliente', 'Assigning...': 'Asignando …', 'Already have an account?': '¿Ya tienes una cuenta?', 'Assign': 'Asignar', 'Assign Template': 'Asignar plantilla', 'Assignment Details': 'Detalles de la asignación', 'Back to plans': 'Volver a planes', 'Back to templates': 'Volver a plantillas', 'Beginner': 'Principiante', 'Body Metrics (optional)': 'Métricas corporales (opcional)', 'Built for personal trainers.': 'Creado para entrenadores personales.', 'Cancel': 'Cancelar', 'Cardio': 'Cardio', 'Category': 'Categoría', 'Check everything looks good before saving.': 'Comprueba que todo está correcto antes de guardar.', 'Check your email to confirm your account!': '¡Revisa tu correo electrónico para confirmar tu cuenta!', 'Client': 'Cliente', 'Client & Details': 'Cliente y detalles', 'Client *': 'Cliente *', 'Complete': 'Completar', 'Create Account': 'Crear cuenta', 'Create Template': 'Crear plantilla', 'Create account': 'Crear cuenta', 'Create reusable training templates and assign them to any client with one click.': 'Crea plantillas de entrenamiento reutilizables y asígnalas a cualquier cliente con un clic.', 'Dark mode and text size preferences stored locally on your device.': 'Las preferencias de modo oscuro y tamaño de texto se almacenan localmente en tu dispositivo.', 'Days': 'Días', 'Delete': 'Eliminar', 'Delete plan?': '¿Eliminar el plan?', 'Delete template?': '¿Eliminar la plantilla?', 'Description': 'Descripción', 'Difficulty': 'Dificultad', "Don't have an account?": '¿No tienes una cuenta?', 'Edit': 'Editar', 'Edit Template': 'Editar plantilla', 'Email address and password when you create an account.': 'Dirección de correo electrónico y contraseña al crear una cuenta.', 'Exercises': 'Ejercicios', 'Exercises/Day': 'Ejercicios/día', 'Inactive': 'Inactivo', 'Intermediate': 'Intermedio', 'Map Days to Weekdays': 'Asignar días a días de la semana', 'Name *': 'Nombre *', 'New Training Plan': 'Nuevo plan de entrenamiento', 'Next': 'Siguiente', 'No category': 'Sin categoría', 'No client': 'Sin cliente', 'No exercises added': 'No se han añadido ejercicios', 'No plans yet': 'Aún no hay planes', 'No templates yet': 'Aún no hay plantillas', 'Notes': 'Notas', 'Notes for client': 'Notas para el cliente', 'Password': 'Contraseña', 'Plan Details': 'Detalles del plan', 'Plan Title': 'Título del plan', 'Plan Title *': 'Título del plan *', 'Plan not found': 'Plan no encontrado', 'Previous': 'Anterior', 'Private': 'Privado', 'Public': 'Público', 'Remove': 'Eliminar', 'Rest': 'Descanso', 'Rest sec': 'Descanso (s)', 'Reps max': 'Reps máx.', 'Reps min': 'Reps mín.', 'Review & Save': 'Revisar y guardar', 'Save': 'Guardar', 'Save Changes': 'Guardar cambios', 'Save Plan ✓': 'Guardar plan ✓', 'Save Template': 'Guardar plantilla', 'Save Template ✓': 'Guardar plantilla ✓', 'Save Training Plan': 'Guardar plan de entrenamiento', 'Saving...': 'Guardando …', 'Select Exercise': 'Seleccionar ejercicio', 'Select a client...': 'Selecciona un cliente …', 'Select...': 'Seleccionar …', 'Sets': 'Series', 'Sets × Reps': 'Series × reps', 'Sign In →': 'Iniciar sesión →', 'Sign in': 'Iniciar sesión', 'Sign in to your PT dashboard': 'Inicia sesión en tu panel de entrenador', 'Sign up': 'Registrarse', 'Start managing your clients today': 'Empieza a gestionar a tus clientes hoy', 'Strength': 'Fuerza', 'Template': 'Plantilla', 'Template Details': 'Detalles de la plantilla', 'Template not found': 'Plantilla no encontrada', 'Total Exercises': 'Total de ejercicios', 'Training Days': 'Días de entrenamiento', 'Training Plans': 'Planes de entrenamiento', 'Visibility': 'Visibilidad', 'Week Start': 'Inicio de semana', 'Week Start *': 'Inicio de semana *', 'Week Start Date *': 'Fecha de inicio de semana *', 'Weight': 'Peso', 'Weight kg': 'Peso (kg)', 'Yesterday': 'Ayer', 'Today': 'Hoy', 'Unknown': 'Desconocido', 'Unknown client': 'Cliente desconocido', 'Duplicate': 'Duplicar', 'Duplicate week': 'Duplicar semana', 'Flexibility': 'Flexibilidad', 'Hypertrophy': 'Hipertrofia', 'Rehabilitation': 'Rehabilitación', 'Weight Loss': 'Pérdida de peso', 'Please add a template name.': 'Introduce un nombre para la plantilla.', 'Please fill in all required fields.': 'Completa todos los campos obligatorios.', 'Something went wrong.': 'Algo salió mal.', 'Search exercises...': 'Buscar ejercicios …', 'Day name': 'Nombre del día', 'Focus (e.g. Chest)': 'Objetivo (p. ej., pecho)', 'Instructions or focus for this week...': 'Instrucciones u objetivo para esta semana …', 'PT note (optional)': 'Nota del entrenador (opcional)', 'PT note for client (optional)': 'Nota del entrenador para el cliente (opcional)', 'What is this template for?': '¿Para qué es esta plantilla?', 'e.g. Beginner 3 Day Split': 'p. ej., rutina para principiantes de 3 días', 'e.g. Week 1 — Strength Foundation': 'p. ej., semana 1 — base de fuerza', 'Who is this plan for and when does it start?': '¿Para quién es este plan y cuándo comienza?',
  'Guidance PT ("we", "our", or "us") is a personal training platform that connects personal trainers with their clients. This Privacy Policy explains how we collect, use and protect your personal information when you use our Android app or web dashboard.': 'Guidance PT ("nosotros") es una plataforma de entrenamiento personal que conecta a entrenadores personales con sus clientes. Esta Política de privacidad explica cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestra aplicación Android o panel web.', 'By using Guidance PT you agree to the collection and use of information as described in this policy.': 'Al utilizar Guidance PT, aceptas la recopilación y el uso de información tal como se describe en esta política.', 'To provide and operate the Guidance PT service': 'Prestar y operar el servicio Guidance PT', 'To connect clients with their personal trainer': 'Conectar a los clientes con su entrenador personal', 'To display training plans and track workout progress': 'Mostrar planes de entrenamiento y hacer seguimiento del progreso', 'To calculate and display personal records and statistics': 'Calcular y mostrar récords personales y estadísticas', 'To allow personal trainers to monitor client progress': 'Permitir a los entrenadores personales supervisar el progreso de sus clientes', 'To improve the app based on usage patterns': 'Mejorar la aplicación según los patrones de uso', 'Your personal trainer can see your training plans, logged workouts and body metrics. Other users cannot see your data.': 'Tu entrenador personal puede ver tus planes de entrenamiento, entrenamientos registrados y métricas corporales. Otros usuarios no pueden ver tus datos.', "You can only see data from clients who have connected to you using your invite code. You cannot see data from other trainers' clients.": 'Solo puedes ver datos de clientes que se han conectado contigo mediante tu código de invitación. No puedes ver datos de clientes de otros entrenadores.', 'Your data is stored securely using': 'Tus datos se almacenan de forma segura mediante', 'a cloud database provider with enterprise-grade security. We use Row Level Security (RLS) to ensure users can only access their own data.': 'un proveedor de bases de datos en la nube con seguridad de nivel empresarial. Usamos seguridad a nivel de fila (RLS) para garantizar que los usuarios solo puedan acceder a sus propios datos.', 'All data is encrypted in transit using HTTPS/TLS. We do not sell your personal data to third parties.': 'Todos los datos se cifran durante la transmisión mediante HTTPS/TLS. No vendemos tus datos personales a terceros.', 'We retain your data for as long as your account is active. If you delete your account, your personal data will be removed from our systems within 30 days.': 'Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos personales se eliminarán de nuestros sistemas en un plazo de 30 días.', 'Access the personal data we hold about you': 'Acceder a los datos personales que tenemos sobre ti', 'Request correction of inaccurate data': 'Solicitar la corrección de datos inexactos', 'Request deletion of your account and data': 'Solicitar la eliminación de tu cuenta y tus datos', 'Object to processing of your data': 'Oponerte al tratamiento de tus datos', 'Data portability — receive your data in a readable format': 'Portabilidad de datos: recibir tus datos en un formato legible', 'Guidance PT is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.': 'Guidance PT no está destinado a menores de 16 años. No recopilamos deliberadamente información personal de menores de 16 años.', 'We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.': 'Podemos actualizar esta Política de privacidad ocasionalmente. Avisaremos a los usuarios de cambios importantes por correo electrónico o mediante una notificación en la aplicación. El uso continuado de la aplicación después de los cambios constituye la aceptación de la política actualizada.',
  'Delete Your Account': 'Elimina tu cuenta', 'You can request permanent deletion of your Guidance PT account and all associated data at any time.': 'Puedes solicitar la eliminación permanente de tu cuenta de Guidance PT y de todos los datos asociados en cualquier momento.', 'How to request deletion': 'Cómo solicitar la eliminación', '1. Send an email': '1. Envía un correo electrónico', 'with the subject line': 'con el asunto', '2. Include the email address': '2. Incluye la dirección de correo electrónico', 'associated with your account, so we can verify and locate it.': 'asociada a tu cuenta, para que podamos verificarla y localizarla.', '3. We will process your request': '3. Procesaremos tu solicitud', 'and permanently delete your account and data within 30 days, and confirm by email once complete.': 'y eliminaremos permanentemente tu cuenta y tus datos en un plazo de 30 días; te lo confirmaremos por correo electrónico cuando esté hecho.', 'What gets deleted': 'Qué se elimina', 'Your profile and login credentials': 'Tu perfil y credenciales de inicio de sesión', 'All logged workouts and exercise history': 'Todos los entrenamientos registrados y el historial de ejercicios', 'Training plans assigned to you (or, if you are a PT, created by you)': 'Planes de entrenamiento asignados a ti (o, si eres entrenador, creados por ti)', 'Body weight and other tracked metrics': 'Peso corporal y otras métricas registradas', 'Your connection to any personal trainer or client': 'Tu conexión con cualquier entrenador personal o cliente', 'Note:': 'Nota:', 'Deletion is permanent and cannot be undone. We do not retain backups of deleted personal data beyond what is required for fraud prevention or legal compliance, in which case any retained data is anonymized.': 'La eliminación es permanente y no se puede deshacer. No conservamos copias de seguridad de los datos personales eliminados más allá de lo necesario para la prevención del fraude o el cumplimiento legal; en ese caso, los datos conservados se anonimizan.', 'See also our': 'Consulta también nuestra',
  'Exercise title': 'Nombre del ejercicio', 'Edit Days': 'Editar días', 'Save Changes ✓': 'Guardar cambios ✓', 'Personal trainer with client': 'Entrenador personal con cliente', 'Coach with client': 'Entrenador con cliente', 'This cannot be undone.': 'Esta acción no se puede deshacer.', 'to': 'a',
})

const patterns: Array<{
  regex: RegExp
  nb: (match: RegExpMatchArray) => string
  es: (match: RegExpMatchArray) => string
}> = [
  { regex: /^Day (\d+)$/, nb: m => `Dag ${m[1]}`, es: m => `Día ${m[1]}` },
  { regex: /^(\d+)\/(\d+) days? completed$/, nb: m => `${m[1]}/${m[2]} dager fullført`, es: m => `${m[1]}/${m[2]} días completados` },
  { regex: /^(\d+) days?$/, nb: m => `${m[1]} ${m[1] === '1' ? 'dag' : 'dager'}`, es: m => `${m[1]} ${m[1] === '1' ? 'día' : 'días'}` },
  { regex: /^(\d+) exercises?$/, nb: m => `${m[1]} ${m[1] === '1' ? 'øvelse' : 'øvelser'}`, es: m => `${m[1]} ejercicio${m[1] === '1' ? '' : 's'}` },
  { regex: /^(\d+) sets?$/, nb: m => `${m[1]} sett`, es: m => `${m[1]} serie${m[1] === '1' ? '' : 's'}` },
  { regex: /^(\d+) days? completed$/, nb: m => `${m[1]} ${m[1] === '1' ? 'dag fullført' : 'dager fullført'}`, es: m => `${m[1]} día${m[1] === '1' ? '' : 's'} completado${m[1] === '1' ? '' : 's'}` },
  { regex: /^(\d+) skipped$/, nb: m => `${m[1]} hoppet over`, es: m => `${m[1]} omitido${m[1] === '1' ? '' : 's'}` },
  { regex: /^Week of (.+)$/, nb: m => `Uken fra ${m[1]}`, es: m => `Semana del ${m[1]}` },
  { regex: /^(\d+) of (\d+) weeks$/, nb: m => `${m[1]} av ${m[2]} uker`, es: m => `${m[1]} de ${m[2]} semanas` },
  { regex: /^Create a training plan for (.+)$/, nb: m => `Opprett en treningsplan for ${m[1]}`, es: m => `Crea un plan de entrenamiento para ${m[1]}` },
  { regex: /^Delete (.+)\?$/, nb: m => `Slette ${m[1]}?`, es: m => `¿Eliminar ${m[1]}?` },
  { regex: /^Delete "(.+)"\? This cannot be undone\.$/, nb: m => `Slette "${m[1]}"? Dette kan ikke angres.`, es: m => `¿Eliminar "${m[1]}"? Esta acción no se puede deshacer.` },
  { regex: /^"(.+)" will be permanently deleted\. This cannot be undone\.$/, nb: m => `"${m[1]}" vil bli slettet permanent. Dette kan ikke angres.`, es: m => `"${m[1]}" se eliminará permanentemente. Esta acción no se puede deshacer.` },
  { regex: /^Deletion is permanent and cannot be undone\. We do not retain backups of deleted\s+personal data beyond what is required for fraud prevention or legal compliance,\s+in which case any retained data is anonymized\.$/, nb: () => 'Sletting er permanent og kan ikke angres. Vi beholder ikke sikkerhetskopier av slettede personopplysninger utover det som er nødvendig for å forebygge svindel eller oppfylle juridiske krav. I slike tilfeller anonymiseres eventuelle data som beholdes.', es: () => 'La eliminación es permanente y no se puede deshacer. No conservamos copias de seguridad de los datos personales eliminados más allá de lo necesario para la prevención del fraude o el cumplimiento legal; en ese caso, los datos conservados se anonimizan.' },
  { regex: /^(\d+)% done$/, nb: m => `${m[1]} % fullført`, es: m => `${m[1]} % completado` },
  { regex: /^Expires (.+)$/, nb: m => `Utløper ${m[1]}`, es: m => `Caduca ${m[1]}` },

  // "Connected …" (clients list) and "Client since …" (client detail) share the same
  // four shapes produced by the local timeAgo() helper: Today / Yesterday / N days ago / N weeks ago.
  { regex: /^Connected Today$/, nb: () => 'Tilkoblet i dag', es: () => 'Conectado hoy' },
  { regex: /^Connected Yesterday$/, nb: () => 'Tilkoblet i går', es: () => 'Conectado ayer' },
  { regex: /^Connected (\d+) days? ago$/, nb: m => `Tilkoblet for ${m[1]} ${m[1] === '1' ? 'dag' : 'dager'} siden`, es: m => `Conectado hace ${m[1]} día${m[1] === '1' ? '' : 's'}` },
  { regex: /^Connected (\d+) weeks? ago$/, nb: m => `Tilkoblet for ${m[1]} ${m[1] === '1' ? 'uke' : 'uker'} siden`, es: m => `Conectado hace ${m[1]} semana${m[1] === '1' ? '' : 's'}` },
  { regex: /^Client since Today$/, nb: () => 'Kunde fra i dag', es: () => 'Cliente desde hoy' },
  { regex: /^Client since Yesterday$/, nb: () => 'Kunde siden i går', es: () => 'Cliente desde ayer' },
  { regex: /^Client since (\d+) days? ago$/, nb: m => `Kunde i ${m[1]} ${m[1] === '1' ? 'dag' : 'dager'}`, es: m => `Cliente desde hace ${m[1]} día${m[1] === '1' ? '' : 's'}` },
  { regex: /^Client since (\d+) weeks? ago$/, nb: m => `Kunde i ${m[1]} ${m[1] === '1' ? 'uke' : 'uker'}`, es: m => `Cliente desde hace ${m[1]} semana${m[1] === '1' ? '' : 's'}` },
]

function translateText(value: string, target: 'nb' | 'es') {
  const leading = value.match(/^\s*/)?.[0] ?? ''
  const trailing = value.match(/\s*$/)?.[0] ?? ''
  const text = value.trim()
  if (!text) return value

  const prefixMatch = text.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ0-9]*)([\s\S]*)$/)
  const prefix = prefixMatch?.[1] ?? ''
  const core = prefixMatch?.[2] ?? text
  const dictionary = target === 'nb' ? norwegian : spanish
  let translated = dictionary[core]
  if (!translated) {
    for (const rule of patterns) {
      const match = core.match(rule.regex)
      if (match) { translated = rule[target](match); break }
    }
  }
  if (!translated) return value
  return `${leading}${prefix}${translated}${trailing}`
}

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (english: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: value => value,
})

const LANGUAGE_CYCLE: Language[] = ['en', 'nb', 'es']

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const originals = useRef(new WeakMap<Node, string>())
  const attributeOriginals = useRef(new WeakMap<Element, Map<string, string>>())

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    localStorage.setItem('guidance-language', next)
    document.documentElement.lang = next
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('guidance-language')
    const browserLang = navigator.language.toLowerCase()
    const detected: Language =
      browserLang.startsWith('nb') || browserLang.startsWith('no') ? 'nb' :
      browserLang.startsWith('es') ? 'es' :
      'en'
    // The saved browser preference is only available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(saved === 'nb' || saved === 'en' || saved === 'es' ? saved : detected)
  }, [setLanguage])

  useEffect(() => {
    const originalText = originals.current
    const originalAttrs = attributeOriginals.current

    const process = (root: Node) => {
      const nodes: Node[] = root.nodeType === Node.TEXT_NODE ? [root] : []
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) nodes.push(walker.currentNode)

      for (const node of nodes) {
        if (node.parentElement?.closest('[data-no-translate]')) continue
        if (!originalText.has(node)) originalText.set(node, node.textContent ?? '')
        const original = originalText.get(node) ?? ''
        const desired = language === 'en' ? original : translateText(original, language)
        if (node.textContent !== desired) node.textContent = desired
      }

      const elements: Element[] = root instanceof Element ? [root, ...root.querySelectorAll('*')] : []
      for (const element of elements) {
        if (element.closest('[data-no-translate]')) continue
        for (const attribute of ['placeholder', 'title', 'aria-label', 'alt']) {
          const current = element.getAttribute(attribute)
          if (!current) continue
          let saved = originalAttrs.get(element)
          if (!saved) { saved = new Map(); originalAttrs.set(element, saved) }
          if (!saved.has(attribute)) saved.set(attribute, current)
          const original = saved.get(attribute) ?? current
          element.setAttribute(attribute, language === 'en' ? original : translateText(original, language))
        }
      }
    }

    process(document.body)
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') record.addedNodes.forEach(process)
        if (record.type === 'characterData' && !originals.current.has(record.target)) process(record.target)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [language])

  const t = useCallback(
    (english: string) => language === 'en' ? english : translateText(english, language).trim(),
    [language]
  )

  const toggleLanguage = useCallback(() => {
    const next = LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length]
    setLanguage(next)
  }, [language, setLanguage])

  const nextLanguageLabel =
    LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length] === 'nb' ? 'Bytt til norsk' :
    LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length] === 'es' ? 'Cambiar a español' :
    'Switch to English'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
      <button
        type="button"
        data-no-translate
        onClick={toggleLanguage}
        aria-label={nextLanguageLabel}
        title={nextLanguageLabel}
        className="fixed bottom-5 right-5 z-[100] rounded-full px-4 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: 'var(--surface, #1A1A1A)', color: 'var(--text, #fff)', border: '1px solid var(--border, #333)' }}
      >
        <span style={{ color: language === 'en' ? 'var(--primary, #FF4500)' : 'inherit' }}>EN</span>
        <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
        <span style={{ color: language === 'nb' ? 'var(--primary, #FF4500)' : 'inherit' }}>NO</span>
        <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
        <span style={{ color: language === 'es' ? 'var(--primary, #FF4500)' : 'inherit' }}>ES</span>
      </button>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
