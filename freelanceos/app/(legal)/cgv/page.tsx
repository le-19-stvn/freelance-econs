import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CGV / CGU',
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

export default function CGVPage() {
  return (
    <article>
      <h1 style={h1}>Conditions Generales de Vente et d&apos;Utilisation</h1>
      <p style={subtitle}>Derniere mise a jour : 18 avril 2026</p>

      {/* ── 1. Objet ── */}
      <h2 style={h2}>1. Objet</h2>
      <p style={p}>
        Les presentes Conditions Generales de Vente et d&apos;Utilisation (ci-apres &laquo;&nbsp;CGV/CGU&nbsp;&raquo;)
        regissent l&apos;acces et l&apos;utilisation du service en ligne
        <span style={strong}> Freelance</span>, edite par <span style={strong}>eCons</span> (auto-entrepreneur,
        Loan ESTEVENON).
      </p>
      <p style={p}>
        En creant un compte ou en utilisant le Service, l&apos;utilisateur accepte sans reserve
        l&apos;integralite des presentes CGV/CGU.
      </p>

      {/* ── 2. Description du Service ── */}
      <h2 style={h2}>2. Description du Service</h2>
      <p style={p}>
        Freelance est une <span style={strong}>application SaaS (Software as a Service)</span> de
        gestion d&apos;activite destinee aux travailleurs independants et auto-entrepreneurs.
        Le Service propose notamment&nbsp;:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={li}>La gestion de clients et de contacts professionnels</li>
        <li style={li}>Le suivi de projets (statut, deadline, budget)</li>
        <li style={li}>La creation, l&apos;edition et l&apos;envoi de factures</li>
        <li style={li}>L&apos;export de documents (PDF, CSV)</li>
        <li style={li}>Un tableau de bord avec indicateurs cles (chiffre d&apos;affaires, factures en attente, etc.)</li>
      </ul>
      <div
        style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <p style={{ ...p, marginBottom: 0, color: '#92400E', fontWeight: 600 }}>
          Important&nbsp;: Freelance est un outil d&apos;aide a la gestion. Il ne se substitue
          en aucun cas a un expert-comptable, un commissaire aux comptes ou un conseil juridique.
          Les documents generes (factures, devis) sont etablis sous la seule et entiere
          responsabilite de l&apos;utilisateur, qui doit s&apos;assurer de leur conformite avec
          la reglementation en vigueur.
        </p>
      </div>

      {/* ── 3. Inscription et compte ── */}
      <h2 style={h2}>3. Inscription et compte utilisateur</h2>
      <p style={p}>
        L&apos;acces au Service necessite la creation d&apos;un compte via une authentification
        <span style={strong}> Google (OAuth 2.0)</span>. L&apos;utilisateur garantit que les
        informations communiquees sont exactes et s&apos;engage a les maintenir a jour.
      </p>
      <p style={p}>
        Chaque compte est personnel et incessible. L&apos;utilisateur est responsable de la
        confidentialite de ses identifiants et de toute activite effectuee depuis son compte.
      </p>

      {/* ── 4. Offres et tarification ── */}
      <h2 style={h2}>4. Offres et tarification</h2>
      <p style={p}>
        Le Service propose deux formules&nbsp;:
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
            {['', 'Plan Gratuit (Free)', 'Plan Pro'].map((h) => (
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
            ['Clients', '3 maximum', 'Illimites'],
            ['Projets actifs', '4 maximum', 'Illimites'],
            ['Factures', '5 maximum', 'Illimitees'],
            ['Export PDF / CSV', 'Oui', 'Oui'],
            ['Multi-devises (EUR/USD/GBP/CHF)', 'Oui', 'Oui'],
            ['Simulateur URSSAF', 'Non', 'Oui'],
            ['KPI Previsionnel', 'Non', 'Oui'],
            ['Branding factures (logo + couleur)', 'Non', 'Oui'],
            ['Relances automatiques (J+3, J+7, J+15)', 'Non', 'Oui'],
            ['Support', 'Communautaire', 'Prioritaire'],
            ['Tarif', 'Gratuit', '5,99 EUR / mois (TTC)'],
          ] as const).map(([feature, free, pro]) => (
            <tr key={feature}>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', fontWeight: 600, color: '#0F1117' }}>
                {feature}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {free}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #E4E6ED', color: '#2C2F3A' }}>
                {pro}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 5. Paiement ── */}
      <h2 style={h2}>5. Paiement et facturation</h2>
      <p style={p}>
        Le paiement du plan Pro est effectue par carte bancaire via la plateforme securisee
        <span style={strong}> Stripe</span> (Stripe, Inc. &mdash; Etats-Unis / Stripe Payments
        Europe Ltd. &mdash; Irlande).
      </p>
      <p style={p}>
        L&apos;abonnement est a <span style={strong}>renouvellement automatique</span> (mensuel ou
        annuel selon l&apos;offre souscrite). L&apos;utilisateur sera debite automatiquement a
        chaque echeance sauf resiliation prealable.
      </p>
      <p style={p}>
        Les prix sont indiques en euros, toutes taxes comprises (TTC) ou hors taxes (HT) selon
        le statut fiscal de l&apos;utilisateur et de l&apos;editeur. L&apos;editeur etant
        auto-entrepreneur non assujetti a la TVA, la mention &laquo;&nbsp;TVA non applicable,
        article 293 B du Code General des Impots&nbsp;&raquo; s&apos;applique.
      </p>

      {/* ── 6. Droit de retractation ── */}
      <h2 style={h2}>6. Droit de retractation</h2>
      <p style={p}>
        Conformement a l&apos;article L.221-28 du Code de la consommation, le droit de retractation
        <span style={strong}> ne s&apos;applique pas</span> aux contrats de fourniture de contenu
        numerique non fourni sur un support materiel dont l&apos;execution a commence avec
        l&apos;accord prealable expres du consommateur et renonciation expresse a son droit de
        retractation.
      </p>
      <p style={p}>
        En souscrivant au plan Pro, l&apos;utilisateur reconnait et accepte que l&apos;acces
        immediat au Service constitue un debut d&apos;execution et renonce expressement a son
        droit de retractation de 14 jours.
      </p>
      <p style={p}>
        L&apos;utilisateur conserve neanmoins la possibilite de <span style={strong}>resilier
        son abonnement a tout moment</span> depuis son espace &laquo;&nbsp;Profil&nbsp;&raquo;.
        La resiliation prend effet a la fin de la periode de facturation en cours&nbsp;;
        aucun remboursement au prorata ne sera effectue.
      </p>

      {/* ── 7. Resiliation ── */}
      <h2 style={h2}>7. Resiliation</h2>
      <p style={p}>
        L&apos;utilisateur peut resilier son abonnement Pro a tout moment via le portail de
        facturation Stripe accessible depuis la page Profil. La resiliation prend effet a la
        fin de la periode de facturation en cours.
      </p>
      <p style={p}>
        L&apos;utilisateur peut egalement supprimer son compte en contactant
        <span style={strong}> contact@econs.fr</span>. La suppression entraine
        l&apos;effacement definitif de toutes ses donnees sous 30 jours.
      </p>
      <p style={p}>
        eCons se reserve le droit de suspendre ou resilier un compte en cas de violation des
        presentes CGV/CGU, d&apos;utilisation abusive ou frauduleuse du Service.
      </p>

      {/* ── 8. Disponibilite ── */}
      <h2 style={h2}>8. Disponibilite du Service</h2>
      <p style={p}>
        eCons s&apos;efforce de maintenir le Service accessible 24h/24 et 7j/7. Toutefois,
        l&apos;acces peut etre temporairement interrompu pour des raisons de maintenance,
        de mise a jour ou en cas de force majeure. eCons ne saurait etre tenu responsable
        d&apos;une interruption de service, quelle qu&apos;en soit la duree.
      </p>

      {/* ── 9. Responsabilite ── */}
      <h2 style={h2}>9. Limitation de responsabilite</h2>
      <p style={p}>
        Le Service est fourni &laquo;&nbsp;en l&apos;etat&nbsp;&raquo;. eCons ne garantit pas que
        le Service sera exempt d&apos;erreurs, de bugs ou d&apos;interruptions.
      </p>
      <p style={p}>
        <span style={strong}>La responsabilite d&apos;eCons est limitee au montant total des
        sommes effectivement versees par l&apos;utilisateur au cours des 12 derniers mois
        precedant l&apos;evenement generateur de responsabilite.</span>
      </p>
      <p style={p}>
        En aucun cas eCons ne pourra etre tenu responsable des dommages indirects, y compris
        mais sans s&apos;y limiter&nbsp;: perte de donnees, perte de chiffre d&apos;affaires,
        prejudice commercial, penalites fiscales resultant de factures incorrectes ou
        non conformes generees par l&apos;utilisateur via le Service.
      </p>
      <div
        style={{
          background: '#FEE9EC',
          border: '1px solid #C0152A',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <p style={{ ...p, marginBottom: 0, color: '#991B1B', fontWeight: 600 }}>
          Rappel&nbsp;: les factures et documents generes via Freelance sont sous la
          responsabilite exclusive de l&apos;utilisateur. Freelance est un outil d&apos;aide
          a la gestion&nbsp;; il ne remplace pas un cabinet comptable ni un conseil juridique.
        </p>
      </div>

      {/* ── 10. Propriete intellectuelle ── */}
      <h2 style={h2}>10. Propriete intellectuelle</h2>
      <p style={p}>
        Le code source, le design, les textes et l&apos;ensemble des elements constituant
        le Service sont la propriete exclusive d&apos;eCons. Toute reproduction ou utilisation
        non autorisee constitue une contrefacon sanctionnee par le Code de la propriete
        intellectuelle.
      </p>
      <p style={p}>
        L&apos;utilisateur conserve la pleine propriete de ses donnees (clients, projets,
        factures) saisies dans le Service.
      </p>

      {/* ── 11. Droit applicable ── */}
      <h2 style={h2}>11. Droit applicable et litiges</h2>
      <p style={p}>
        Les presentes CGV/CGU sont soumises au <span style={strong}>droit francais</span>.
      </p>
      <p style={p}>
        En cas de litige, les parties s&apos;efforceront de trouver une solution amiable.
        A defaut, le litige sera porte devant les juridictions competentes du ressort du
        siege de l&apos;editeur, conformement aux regles de competence en vigueur.
      </p>
      <p style={p}>
        Conformement a l&apos;article L.612-1 du Code de la consommation, le consommateur peut
        recourir gratuitement a un mediateur de la consommation en vue de la resolution
        amiable du litige.
      </p>

      {/* ── 12. Contact ── */}
      <h2 style={h2}>12. Contact</h2>
      <p style={p}>
        Pour toute question relative aux presentes CGV/CGU&nbsp;:
        <span style={strong}> contact@econs.fr</span>
      </p>
    </article>
  )
}
