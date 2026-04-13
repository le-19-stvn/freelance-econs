# Phase 6 — Pro Features & Multi-Devises

**Date:** 2026-04-13
**Prix:** 5,99 EUR/mois
**Approche:** Quick Wins — features livrées par ordre de ratio valeur/effort

---

## Contexte

eCons Freelance est un SaaS Next.js 14 + Supabase + Stripe pour freelances francais.
Le plan free limite aujourd'hui : 3 clients, 4 projets actifs, 5 factures.
Le plan Pro (deja integre via Stripe Checkout + Webhooks) releve ces caps a l'illimite.

L'objectif est d'ajouter des features exclusives Pro qui justifient l'abonnement
au-dela des simples limites numeriques, plus une feature gratuite (multi-devises)
pour l'acquisition internationale.

---

## Features Pro (5,99 EUR/mois)

### 1. Gating URSSAF + Mise a jour UpgradeModal

**Effort:** Tres faible

**URSSAF:** Le widget "Smart Focus" du dashboard (simulation cotisations + net estime)
devient Pro-only. Les utilisateurs free voient un placeholder floute avec un CTA
"Passer au Pro".

**UpgradeModal:** Mettre a jour la liste des features affichees :
- Clients, projets, factures illimites
- Simulateur URSSAF
- Branding sur les factures (logo + couleurs)
- Relances automatiques
- Previsionnel de revenus

---

### 2. Branding factures

**Effort:** Moyen

**Nouveaux champs profil (table `profiles`):**
- `invoice_logo_url` (text | null) — URL du logo uploade via Supabase Storage
- `invoice_primary_color` (text | null) — code hex, defaut : #1D4ED8 (blue-700)

**UI — Page Parametres:**
- Nouvelle section "Branding factures" visible uniquement pour les Pro
- Upload de logo (meme systeme que l'avatar existant, Supabase Storage)
- Color picker simple pour la couleur primaire
- Apercu en miniature
- Pour les free : section visible mais grisee avec badge "Pro"

**Impact PDF (`/api/invoices/[id]/pdf`):**
- Si `invoice_logo_url` existe -> logo affiche en haut a gauche
- Si `invoice_primary_color` existe -> couleur appliquee sur en-tetes et lignes d'accent
- Free : branding par defaut (pas de logo, couleur standard)

---

### 3. Previsionnel de revenus

**Effort:** Faible

**Logique de calcul:**
- Factures `sent` (envoyees, pas encore payees) -> somme TTC = "revenus en attente"
- Projets `ongoing` avec budget > 0 -> somme budgets = "revenus potentiels"
- Total previsionnel = revenus en attente + revenus potentiels

**UI — Dashboard:**
- Nouveau KPICard "Previsionnel" dans la rangee KPI existante
- Affiche le montant total
- Sous-texte decompose : "X EUR en attente - Y EUR en cours"
- Pour les free : card present mais floute avec cadenas "Pro"

Pas de graphique previsionnel complexe — juste un chiffre clair et actionnable.

---

### 4. Relances automatiques (sequence)

**Effort:** Eleve

**Nouvelle table `invoice_reminders`:**
```sql
CREATE TABLE invoice_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  sequence_step INTEGER NOT NULL, -- 1, 2, 3
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Declenchement:**
- Quand une facture a une `due_date` et n'est pas payee apres cette date,
  les 3 rappels se planifient automatiquement :
  - Rappel 1 : due_date + 3 jours — ton doux ("Petit rappel...")
  - Rappel 2 : due_date + 7 jours — ton neutre ("Relance facture N...")
  - Rappel 3 : due_date + 15 jours — ton ferme ("Dernier rappel avant...")

**Execution:**
- Supabase Edge Function lancee par cron (toutes les heures)
- Cherche les reminders `pending` ou `scheduled_at <= now()`
- Envoie l'email via le meme systeme que l'envoi manuel existant
- Marque comme `sent` ou `failed`

**Annulation:**
- Facture passe en `paid` -> tous les reminders pending annules
- Facture passe en `draft` -> idem

**UI — Page facture detail:**
- Indicateur "Relances auto activees" avec les dates prevues
- Delais fixes (J+3, J+7, J+15), pas de config utilisateur

**Free:** Pas de relances. Badge "Pro" sur l'option.

---

## Feature gratuite (tous les plans)

### 5. Multi-devises

**Effort:** Moyen

**Nouveau champ sur les factures (table `invoices`):**
- `currency` (text, defaut : 'EUR') — code ISO 4217

**Devises supportees:**
- EUR (symbole EUR), USD ($), GBP (GBP), CHF (CHF)

**Impact:**
- Selecteur de devise dans le formulaire de creation/edition de facture (`invoices/[id]`)
- `formatCurrency()` utilise le code devise au lieu de toujours afficher EUR
- Le PDF s'adapte au symbole de la devise choisie
- Dashboard et KPIs restent en EUR — pas de conversion automatique

**Regle:** Pas de taux de change, pas de conversion. L'utilisateur facture dans la
devise qu'il veut, le montant est stocke tel quel. Le previsionnel et le CA total
ne prennent en compte que les factures en EUR (ou toutes avec un avertissement
"devises mixtes").

---

## Ordre d'implementation recommande

1. Gating URSSAF + UpgradeModal (quasi zero dev)
2. Previsionnel revenus (faible effort, visible immediatement)
3. Multi-devises (gratuit, acquisition internationale)
4. Branding factures (migration DB + upload + PDF)
5. Relances automatiques (plus complexe : table + Edge Function + cron)

---

## Hors perimetre

- Taux de change / conversion automatique
- Configuration des delais de relance par l'utilisateur
- Plus de 4 devises
- Deuxieme tier (Pro+)
- Factures automatiques (feature core gratuite, pas gatee)
