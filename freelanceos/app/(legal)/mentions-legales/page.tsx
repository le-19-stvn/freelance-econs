import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Legales - FreelanceOS',
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

export default function MentionsLegalesPage() {
  return (
    <article>
      <h1 style={h1}>Mentions Legales</h1>
      <p style={subtitle}>Derniere mise a jour : 31 mars 2026</p>

      {/* ── 1. Editeur ── */}
      <h2 style={h2}>1. Editeur du site</h2>
      <p style={p}>
        Le site <span style={strong}>FreelanceOS</span> (ci-apres &laquo;&nbsp;le Service&nbsp;&raquo;)
        est edite par&nbsp;:
      </p>
      <table style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2F3A', marginBottom: 24, borderCollapse: 'collapse' }}>
        <tbody>
          {([
            ['Denomination', 'eCons'],
            ['Forme juridique', 'Auto-entrepreneur (micro-entreprise)'],
            ['Responsable de la publication', 'Loan ESTEVENON'],
            ['Adresse e-mail', 'contact@econs.fr'],
            ['Numero SIRET', 'En cours d\'immatriculation'],
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

      {/* ── 2. Hebergement ── */}
      <h2 style={h2}>2. Hebergement</h2>
      <p style={p}>
        Le Service est heberge par&nbsp;:
      </p>
      <table style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2F3A', marginBottom: 24, borderCollapse: 'collapse' }}>
        <tbody>
          {([
            ['Hebergeur', 'Vercel Inc.'],
            ['Adresse', '340 S Lemon Ave #4133, Walnut, CA 91789, USA'],
            ['Site web', 'https://vercel.com'],
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
      <p style={p}>
        Les donnees utilisateur (base de donnees) sont stockees par
        <span style={strong}> Supabase Inc.</span> sur des serveurs situes en
        <span style={strong}> Europe (Francfort, Allemagne)</span>, conformement au
        Reglement General sur la Protection des Donnees (RGPD).
      </p>

      {/* ── 3. Paiements ── */}
      <h2 style={h2}>3. Traitement des paiements</h2>
      <p style={p}>
        Les paiements sont traites par <span style={strong}>Stripe, Inc.</span> (domicilieaux Etats-Unis, avec une entite europeenne Stripe Payments Europe Ltd., Irlande).
        Aucune donnee bancaire (numero de carte, IBAN) n&apos;est stockee sur nos
        serveurs&nbsp;; elles transitent exclusivement via l&apos;infrastructure securisee de Stripe,
        certifiee <span style={strong}>PCI-DSS Niveau&nbsp;1</span>.
      </p>

      {/* ── 4. Propriete intellectuelle ── */}
      <h2 style={h2}>4. Propriete intellectuelle</h2>
      <p style={p}>
        L&apos;ensemble du contenu du site (textes, interface, logo, code source) est la propriete
        exclusive d&apos;eCons, sauf mention contraire. Toute reproduction, meme partielle, est
        interdite sans autorisation prealable ecrite.
      </p>

      {/* ── 5. Responsabilite ── */}
      <h2 style={h2}>5. Limitation de responsabilite</h2>
      <p style={p}>
        FreelanceOS est un <span style={strong}>outil d&apos;aide a la gestion</span> destine
        aux travailleurs independants. Il ne constitue en aucun cas un cabinet comptable,
        un service de conseil fiscal ou juridique.
      </p>
      <p style={p}>
        Les factures, devis et documents generes via le Service sont etablis sous la
        <span style={strong}> seule responsabilite de l&apos;utilisateur</span>. Il appartient a
        ce dernier de verifier leur conformite avec la legislation applicable (Code de commerce,
        Code general des impots, etc.) et, le cas echeant, de consulter un professionnel qualifie.
      </p>
      <p style={p}>
        eCons decline toute responsabilite en cas d&apos;erreurs, d&apos;omissions ou
        d&apos;inexactitudes dans les documents produits par l&apos;utilisateur a l&apos;aide du Service.
      </p>

      {/* ── 6. Contact ── */}
      <h2 style={h2}>6. Contact</h2>
      <p style={p}>
        Pour toute question relative aux presentes mentions legales, vous pouvez nous
        contacter a l&apos;adresse&nbsp;:
        <span style={strong}> contact@econs.fr</span>.
      </p>
    </article>
  )
}
