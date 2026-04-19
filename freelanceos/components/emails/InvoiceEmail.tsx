import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Preview,
  Row,
  Column,
  Img,
} from '@react-email/components'
import * as React from 'react'

interface InvoiceEmailProps {
  freelanceName: string
  clientName: string
  invoiceNumber: string
  totalAmount: string
  dueDate: string
  invoiceUrl?: string
  paymentLink?: string
  logoUrl?: string | null
  primaryColor?: string | null
}

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO_STACK =
  "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace"

const DEFAULT_BRAND = '#1D4ED8'

const isValidHex = (c?: string | null): c is string =>
  !!c && /^#[0-9a-fA-F]{6}$/.test(c)

export default function InvoiceEmail({
  freelanceName = 'Freelance',
  clientName = 'Client',
  invoiceNumber = 'FAC-2026-001',
  totalAmount = '0,00\u00a0\u20ac',
  dueDate = '—',
  invoiceUrl = '#',
  paymentLink,
  logoUrl,
  primaryColor,
}: InvoiceEmailProps) {
  const brand = isValidHex(primaryColor) ? primaryColor : DEFAULT_BRAND

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Facture {invoiceNumber} — {totalAmount}
      </Preview>
      <Body style={bodyCss}>
        <Container style={containerCss}>

          {/* Card */}
          <Section style={cardCss}>

            {/* Header */}
            <Section style={{ padding: '24px 32px 0' }}>
              <Row>
                <Column align="left">
                  {logoUrl ? (
                    <Img
                      src={logoUrl}
                      alt={freelanceName}
                      height="32"
                      style={{ height: 32, width: 'auto', border: 0, display: 'block' }}
                    />
                  ) : (
                    <span style={logoBadge(brand)}>{freelanceName}</span>
                  )}
                </Column>
                <Column align="right">
                  <span style={statusBadge(brand)}>FACTURE</span>
                </Column>
              </Row>
            </Section>

            {/* Kicker + Title */}
            <Section style={{ padding: '28px 32px 0' }}>
              <Text style={kickerCss(brand)}>Nouvelle facture</Text>
              <Text style={headlineCss}>
                {freelanceName} vous a envoyé une facture
              </Text>
            </Section>

            {/* Body */}
            <Section style={{ padding: '20px 32px 0' }}>
              <Text style={paragraphCss}>Bonjour {clientName},</Text>
              <Text style={paragraphCss}>
                Veuillez trouver ci-joint la facture <strong style={{ color: '#18181b' }}>{invoiceNumber}</strong> au format PDF.
                Le récapitulatif ci-dessous reprend les éléments principaux.
              </Text>
            </Section>

            {/* Summary card */}
            <Section style={{ padding: '0 32px' }}>
              <Section style={summaryCardCss}>
                <Row>
                  <Column style={{ padding: '6px 0' }}>
                    <Text style={summaryLabelCss}>Facture</Text>
                  </Column>
                  <Column align="right" style={{ padding: '6px 0' }}>
                    <Text style={summaryValueMonoCss}>{invoiceNumber}</Text>
                  </Column>
                </Row>
                <Row>
                  <Column style={{ padding: '6px 0' }}>
                    <Text style={summaryLabelCss}>Échéance</Text>
                  </Column>
                  <Column align="right" style={{ padding: '6px 0' }}>
                    <Text style={summaryValueMonoCss}>{dueDate}</Text>
                  </Column>
                </Row>
                <Row>
                  <Column colSpan={2} style={{ padding: '10px 0 6px', borderTop: '1px solid #e4e4e7' }} />
                </Row>
                <Row>
                  <Column style={{ padding: '6px 0' }}>
                    <Text style={summaryTotalLabelCss}>Montant TTC</Text>
                  </Column>
                  <Column align="right" style={{ padding: '6px 0' }}>
                    <Text style={summaryTotalValueCss(brand)}>{totalAmount}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {/* CTAs */}
            <Section style={{ padding: '8px 32px 0', textAlign: 'center' as const }}>
              {paymentLink && (
                <Button style={primaryButtonCss(brand)} href={paymentLink}>
                  Payer maintenant →
                </Button>
              )}
              <div style={{ height: 10 }} />
              <Button style={secondaryButtonCss} href={invoiceUrl}>
                Consulter la facture (PDF)
              </Button>
            </Section>

            {/* Closing */}
            <Section style={{ padding: '28px 32px 0' }}>
              <Text style={paragraphSmallCss}>
                N&apos;hésitez pas à revenir vers nous si vous avez la moindre question.
              </Text>
              <Text style={{ ...paragraphCss, marginTop: 16 }}>
                Cordialement,<br />
                <strong style={{ color: '#18181b' }}>{freelanceName}</strong>
              </Text>
            </Section>

            {/* Spacer */}
            <Section style={{ padding: '28px 32px' }} />
          </Section>

          {/* Footer */}
          <Section style={footerCss}>
            <Text style={footerTextCss}>
              Envoyé via Freelance by eCons ·{' '}
              <a href="https://econs-freelance.com" style={{ color: '#a1a1aa', textDecoration: 'underline' }}>
                econs-freelance.com
              </a>
            </Text>
            <Text style={footerTextCss}>
              La facture est jointe à cet email au format PDF.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/* ─────────── Styles ─────────── */

const bodyCss: React.CSSProperties = {
  backgroundColor: '#fafafa',
  fontFamily: FONT_STACK,
  margin: 0,
  padding: 0,
}

const containerCss: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 16px',
}

const cardCss: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
  overflow: 'hidden',
}

const logoBadge = (brand: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: 8,
  background: brand,
  color: '#ffffff',
  font: `600 13px/1 ${FONT_STACK}`,
  letterSpacing: '-0.01em',
})

const statusBadge = (brand: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 999,
  background: '#eff6ff',
  color: brand,
  font: `600 11px/1 ${MONO_STACK}`,
  letterSpacing: '0.02em',
})

const kickerCss = (brand: string): React.CSSProperties => ({
  margin: '0 0 8px',
  font: `500 11px/1 ${FONT_STACK}`,
  color: brand,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
})

const headlineCss: React.CSSProperties = {
  margin: 0,
  font: `700 24px/1.2 ${FONT_STACK}`,
  color: '#18181b',
  letterSpacing: '-0.02em',
}

const paragraphCss: React.CSSProperties = {
  margin: '0 0 16px',
  font: `400 15px/1.6 ${FONT_STACK}`,
  color: '#3f3f46',
}

const paragraphSmallCss: React.CSSProperties = {
  margin: '0 0 8px',
  font: `400 14px/1.6 ${FONT_STACK}`,
  color: '#52525b',
}

const summaryCardCss: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e4e4e7',
  borderRadius: 12,
  padding: '16px 18px',
}

const summaryLabelCss: React.CSSProperties = {
  margin: 0,
  font: `400 13px/1.5 ${FONT_STACK}`,
  color: '#71717a',
}

const summaryValueMonoCss: React.CSSProperties = {
  margin: 0,
  font: `600 13px/1.5 ${MONO_STACK}`,
  color: '#27272a',
}

const summaryTotalLabelCss: React.CSSProperties = {
  margin: 0,
  font: `500 14px/1.3 ${FONT_STACK}`,
  color: '#18181b',
}

const summaryTotalValueCss = (brand: string): React.CSSProperties => ({
  margin: 0,
  font: `600 20px/1.2 ${MONO_STACK}`,
  color: brand,
  letterSpacing: '-0.01em',
})

const primaryButtonCss = (brand: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: brand,
  color: '#ffffff',
  font: `600 14px/1 ${FONT_STACK}`,
  textDecoration: 'none',
  borderRadius: 10,
  letterSpacing: '-0.005em',
})

const secondaryButtonCss: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 22px',
  backgroundColor: '#f4f4f5',
  color: '#27272a',
  font: `500 13px/1 ${FONT_STACK}`,
  textDecoration: 'none',
  borderRadius: 10,
}

const footerCss: React.CSSProperties = {
  padding: '16px 16px',
  textAlign: 'center' as const,
}

const footerTextCss: React.CSSProperties = {
  margin: '0 0 4px',
  font: `400 11px/1.5 ${FONT_STACK}`,
  color: '#a1a1aa',
}
