import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialite',
}

/* ── Shared styles ── */
const h1: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: '#0F1117',
  marginBottom: 8,
  letterSpacing: -0.5,
}

const subtitle: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 48,
}

const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#0F1117',
  marginTop: 40,
  marginBottom: 12,
}

const p: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: '#2C2F3A',
  marginBottom: 16,
}

const strong: React.CSSProperties = {
  fontWeight: 600,
  color: '#0F1117',
}

const li: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: '#2C2F3A',
  marginBottom: 6,
}

export default function ConfidentialitePage() {
  return (
    <article>
      <h1 style={h1}>Politique de Confidentialite</h1>
      <p style={subtitle}>Derniere mise a jour : 18 avril 2026</p>

      <p style={p}>
        La presente politique de confidentialite decrit comment <span style={strong}>eCons</span>
        {' '}(auto-entrepreneur, Loan ESTEVENON), editeur du service <span style={strong}>Freelance</span>,
        collecte, utilise et protege vos donnees personnelles conformement au
        <span style={strong}> Reglement General sur la Protection des Donnees (RGPD &mdash;
        Reglement UE 2016/679)</span> et a la loi Informatique et Libertes du 6 janvier 1978
        modifiee.
      </p>

      {/* ── 1. Responsable du traitement ── */}
      <h2 style={h2}>1. Responsable du traitement</h2>
      <table style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2F3A', marginBottom: 24, borderCollapse: 'collapse' }}>
        <tbody>
          {([
            ['Responsable', 'Loan ESTEVENON'],
            ['Denomination', 'eCons (auto-entrepreneur)'],
            ['Contact', 'contact@econs.fr'],
          ] as const).map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '4px 16px 4px 0', fontWeight: 600, color: '#0F1117', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                {label}
              </td>
              <td style={{ padding: '4px 0' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 2. Donnees collectees ── */}
      <h2 style={h2}>2. Donnees personnelles collectees</h2>
      <p style={p}>
        Nous collectons et traitons les categories de donnees suivantes&nbsp;:
      </p>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F1117', marginTop: 20, marginBottom: 8 }}>
        a) Donnees d&apos;identification (via Google OAuth)
      </h3>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>Adresse e-mail Google</li>
        <li style={li}>Nom complet (tel que fourni par Google)</li>
        <li style={li}>Photo de profil Google (si disponible)</li>
        <li style={li}>Identifiant unique Google (sub ID)</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F1117', marginTop: 20, marginBottom: 8 }}>
        b) Donnees de profil professionnel (saisies par l&apos;utilisateur)
      </h3>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>Nom de l&apos;entreprise / raison sociale</li>
        <li style={li}>Adresse professionnelle</li>
        <li style={li}>Numero SIRET</li>
        <li style={li}>Numero de TVA intracommunautaire</li>
        <li style={li}>Taux de TVA applicable</li>
        <li style={li}>Logo et avatar (si telecharges)</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F1117', marginTop: 20, marginBottom: 8 }}>
        c) Donnees metier
      </h3>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>Informations clients (nom, e-mail, telephone, adresse, identifiant fiscal)</li>
        <li style={li}>Donnees de projets (nom, description, statut, deadline, budget)</li>
        <li style={li}>Donnees de facturation (numero, montants, lignes de facture, statut, dates)</li>
      </ul>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F1117', marginTop: 20, marginBottom: 8 }}>
        d) Donnees de paiement (via Stripe)
      </h3>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>Identifiant client Stripe (<code style={{ fontSize: 13, background: '#F1F1F5', padding: '2px 6px', borderRadius: 4 }}>stripe_customer_id</code>)</li>
        <li style={li}>Identifiant d&apos;abonnement Stripe (<code style={{ fontSize: 13, background: '#F1F1F5', padding: '2px 6px', borderRadius: 4 }}>stripe_subscription_id</code>)</li>
        <li style={li}>Statut de l&apos;abonnement (actif, annule, impaye)</li>
      </ul>
      <div
        style={{
          background: '#E6F7F2',
          border: '1px solid #0D9E6B',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <p style={{ ...p, marginBottom: 0, color: '#065F46', fontWeight: 600 }}>
          Aucune donnee bancaire sensible (numero de carte, CVV, IBAN) n&apos;est collectee
          ni stockee par Freelance. Ces donnees sont traitees exclusivement par Stripe,
          certifie PCI-DSS Niveau 1.
        </p>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F1117', marginTop: 20, marginBottom: 8 }}>
        e) Donnees techniques et cookies
      </h3>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>
          <span style={strong}>Cookies de session</span> &mdash; necessaires au fonctionnement
          de l&apos;authentification (gestion de la session utilisateur via Supabase Auth).
          Ces cookies sont <span style={strong}>strictement necessaires</span> et ne requierent
          pas de consentement selon l&apos;article 82 du Reglement ePrivacy et les lignes
          directrices de la CNIL.
        </li>
        <li style={li}>
          <span style={strong}>Donnees de telemetrie technique (Sentry)</span> &mdash; en cas
          d&apos;erreur applicative, un rapport anonymise est envoye a Sentry pour diagnostic
          (message d&apos;erreur, stack trace, navigateur, URL de la page, identifiant compte,
          plan d&apos;abonnement). Un enregistrement video anonymise des 30 dernieres secondes
          d&apos;interaction avec l&apos;interface peut etre inclus (Session Replay) uniquement
          lorsqu&apos;une erreur se produit. Cette collecte repose sur l&apos;
          <span style={strong}>interet legitime</span> (art. 6.1.f RGPD) lie a la qualite et
          la securite du Service. Les donnees sont hebergees en Allemagne et conservees 90 jours.
        </li>
        <li style={li}>
          <span style={strong}>Aucun cookie publicitaire ni traceur commercial</span> n&apos;est
          utilise. Nous n&apos;utilisons ni Google Analytics, ni Facebook Pixel, ni aucun
          traceur tiers a des fins marketing.
        </li>
      </ul>

      {/* ── 3. Finalites ── */}
      <h2 style={h2}>3. Finalites et bases legales du traitement</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr>
            {['Finalite', 'Base legale (RGPD art. 6)'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '2px solid #E4E6ED',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F1117',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {([
            ['Fournir et maintenir le Service', 'Execution du contrat (art. 6.1.b)'],
            ['Gerer l\'abonnement et la facturation', 'Execution du contrat (art. 6.1.b)'],
            ['Authentifier l\'utilisateur (session)', 'Execution du contrat (art. 6.1.b)'],
            ['Repondre aux demandes de support', 'Interet legitime (art. 6.1.f)'],
            ['Respecter les obligations legales', 'Obligation legale (art. 6.1.c)'],
          ] as const).map(([finalite, base]) => (
            <tr key={finalite}>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {finalite}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {base}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 4. Stockage et hebergement ── */}
      <h2 style={h2}>4. Stockage et hebergement des donnees</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr>
            {['Service', 'Fournisseur', 'Localisation'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '2px solid #E4E6ED',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F1117',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {([
            ['Base de donnees & Auth', 'Supabase Inc.', 'Europe (Francfort, Allemagne)'],
            ['Hebergement application', 'Vercel Inc.', 'Global CDN (Edge)'],
            ['Paiements', 'Stripe Inc. / Stripe Payments Europe Ltd.', 'USA / Irlande (UE)'],
            ['Stockage fichiers (avatars, logos)', 'Supabase Storage', 'Europe (Francfort, Allemagne)'],
            ['Envoi d\'emails (relances Pro)', 'Resend Inc.', 'USA (encadre par CCT)'],
            ['Monitoring erreurs & performances', 'Sentry (Functional Software Inc.)', 'Europe (Allemagne)'],
          ] as const).map(([service, provider, location]) => (
            <tr key={service}>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', fontWeight: 600, color: '#0F1117' }}>
                {service}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {provider}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {location}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={p}>
        Les transferts de donnees vers les Etats-Unis (Vercel, Stripe) sont encadres par les
        <span style={strong}> Clauses Contractuelles Types (CCT)</span> de la Commission europeenne
        et/ou le <span style={strong}>Data Privacy Framework (DPF)</span> UE-US, conformement aux
        exigences du RGPD (chapitre V).
      </p>

      {/* ── 5. Duree de conservation ── */}
      <h2 style={h2}>5. Duree de conservation</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>
          <span style={strong}>Donnees du compte</span> &mdash; conservees pendant toute la duree
          d&apos;utilisation du Service, puis supprimees dans un delai de 30 jours apres la
          suppression du compte.
        </li>
        <li style={li}>
          <span style={strong}>Donnees de facturation</span> &mdash; conservees 10 ans apres la
          cloture de l&apos;exercice comptable, conformement a l&apos;article L.123-22 du Code
          de commerce.
        </li>
        <li style={li}>
          <span style={strong}>Logs de connexion</span> &mdash; conserves 12 mois conformement
          a l&apos;article 6-II de la LCEN.
        </li>
      </ul>

      {/* ── 6. Partage des donnees ── */}
      <h2 style={h2}>6. Partage des donnees avec des tiers</h2>
      <p style={p}>
        Vos donnees personnelles ne sont <span style={strong}>ni vendues, ni louees, ni cedees</span> a
        des tiers a des fins commerciales ou publicitaires.
      </p>
      <p style={p}>
        Elles sont partagees exclusivement avec les sous-traitants techniques suivants,
        dans la stricte mesure necessaire a la fourniture du Service&nbsp;:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}><span style={strong}>Supabase</span> &mdash; hebergement de la base de donnees et authentification (UE &mdash; Francfort)</li>
        <li style={li}><span style={strong}>Vercel</span> &mdash; hebergement de l&apos;application web</li>
        <li style={li}><span style={strong}>Stripe</span> &mdash; traitement des paiements</li>
        <li style={li}><span style={strong}>Resend</span> &mdash; envoi automatique des relances de factures (plan Pro uniquement)</li>
        <li style={li}><span style={strong}>Sentry</span> &mdash; monitoring des erreurs techniques et des performances de l&apos;application, afin d&apos;ameliorer la qualite du Service. Collecte les logs d&apos;erreur, le type de navigateur et, en cas d&apos;erreur, un enregistrement anonymise des interactions utilisateur (Session Replay)</li>
      </ul>
      <p style={p}>
        Chaque sous-traitant est lie par un accord de traitement des donnees (DPA) conforme
        a l&apos;article 28 du RGPD.
      </p>

      {/* ── 7. Securite ── */}
      <h2 style={h2}>7. Securite des donnees</h2>
      <p style={p}>
        Nous mettons en oeuvre les mesures techniques et organisationnelles appropriees pour
        proteger vos donnees&nbsp;:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>Chiffrement en transit (HTTPS / TLS 1.3)</li>
        <li style={li}>Chiffrement au repos des donnees en base (AES-256, Supabase)</li>
        <li style={li}>Row-Level Security (RLS) &mdash; isolation des donnees par utilisateur</li>
        <li style={li}>Authentification OAuth 2.0 (aucun mot de passe stocke)</li>
        <li style={li}>Conformite PCI-DSS Niveau 1 pour les paiements (Stripe)</li>
      </ul>

      {/* ── 8. Droits ── */}
      <h2 style={h2}>8. Vos droits (RGPD)</h2>
      <p style={p}>
        Conformement aux articles 15 a 22 du RGPD, vous disposez des droits suivants&nbsp;:
      </p>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr>
            {['Droit', 'Description'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '2px solid #E4E6ED',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F1117',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {([
            ['Droit d\'acces (art. 15)', 'Obtenir la confirmation que vos donnees sont traitees et en recevoir une copie'],
            ['Droit de rectification (art. 16)', 'Faire corriger des donnees inexactes ou incompletes'],
            ['Droit a l\'effacement (art. 17)', 'Demander la suppression de vos donnees personnelles'],
            ['Droit a la limitation (art. 18)', 'Demander la limitation du traitement dans certains cas'],
            ['Droit a la portabilite (art. 20)', 'Recevoir vos donnees dans un format structure et lisible par machine'],
            ['Droit d\'opposition (art. 21)', 'Vous opposer au traitement fonde sur l\'interet legitime'],
          ] as const).map(([droit, desc]) => (
            <tr key={droit}>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', fontWeight: 600, color: '#0F1117', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                {droit}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={p}>
        Pour exercer vos droits, contactez-nous a <span style={strong}>contact@econs.fr</span>.
        Nous repondrons dans un delai maximum de <span style={strong}>30 jours</span>.
      </p>
      <p style={p}>
        En cas de reponse insatisfaisante, vous pouvez introduire une reclamation aupres de
        la <span style={strong}>CNIL</span> (Commission Nationale de l&apos;Informatique et des
        Libertes)&nbsp;:
        <br />
        CNIL &mdash; 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
        <br />
        <a href="https://www.cnil.fr" style={{ color: '#1A3FA3' }} target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
      </p>

      {/* ── 9. Mineurs ── */}
      <h2 style={h2}>9. Protection des mineurs</h2>
      <p style={p}>
        Le Service est destine aux professionnels independants et n&apos;est pas concu pour
        les mineurs de moins de 16 ans. Nous ne collectons pas sciemment de donnees
        personnelles de mineurs.
      </p>

      {/* ── 10. Modifications ── */}
      <h2 style={h2}>10. Modifications de la politique</h2>
      <p style={p}>
        Nous nous reservons le droit de modifier la presente politique a tout moment.
        En cas de modification substantielle, les utilisateurs seront informes par e-mail
        ou via une notification dans le Service. La date de derniere mise a jour figure en
        haut de cette page.
      </p>

      {/* ── 11. Contact ── */}
      <h2 style={h2}>11. Contact</h2>
      <p style={p}>
        Pour toute question relative a la protection de vos donnees personnelles&nbsp;:
      </p>
      <table style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2F3A', marginBottom: 24, borderCollapse: 'collapse' }}>
        <tbody>
          {([
            ['Responsable', 'Loan ESTEVENON'],
            ['E-mail', 'contact@econs.fr'],
            ['Objet recommande', '[RGPD] Votre demande'],
          ] as const).map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '4px 16px 4px 0', fontWeight: 600, color: '#0F1117', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                {label}
              </td>
              <td style={{ padding: '4px 0' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}
