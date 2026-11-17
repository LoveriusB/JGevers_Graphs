import type { ImportedWorkbookData } from './types.ts';

export function makeCaseFlowDemo(): ImportedWorkbookData {
  return {
    filename: 'demo-gevers-us.xlsx',
    importedAt: Date.now(),
    headers: [
      'Applicant',
      'Applicant Country',
      'Domestic Representative',
      'Domestic Country',
      'International Representative',
      'International Country',
    ],
    mapping: {
      applicant: 'Applicant',
      applicantCountry: 'Applicant Country',
      domesticRepresentative: 'Domestic Representative',
      domesticCountry: 'Domestic Country',
      internationalRepresentative: 'International Representative',
      internationalCountry: 'International Country',
    },
    rows: [
      ['SAFRAN AERO BOOSTERS', 'BE', 'GEVERS', 'BE', 'LAVERY, DE BILLY, LLP', 'US'],
      ['LOCRINOX', 'BE', 'GEVERS', 'BE', 'CHINA PAT INTELLECTUAL PRO.', 'US'],
      ['LOCRINOX', 'BE', 'GEVERS', 'BE', 'CHINA PAT INTELLECTUAL PRO.', 'US'],
      ['RENSON', 'BE', 'GEVERS', 'BE', 'CHRISTENSEN O\'CONNOR', 'US'],
      ['JT INT', 'CH', 'GEVERS', 'BE', 'DICKINSON WRIGHT PLLC', 'US'],
      ['METALLO BELGIUM', 'BE', 'GEVERS', 'BE', 'FISHERBROYLES, LLP', 'US'],
      ['METALLO BELGIUM', 'BE', 'GEVERS', 'BE', 'FISHERBROYLES, LLP', 'US'],
      ['AURUBIS BEERSE', 'BE', 'GEVERS', 'BE', 'MICHAEL BUCK', 'US'],
      ['LHOIST RECH ET DEVELOPPEMENT', 'BE', 'GEVERS', 'BE', 'BEIJING ZSB PATENT & TRADE', 'US'],
      ['PRAYON', 'BE', 'GEVERS', 'BE', 'LERNER, DAVID, LITTENBERG', 'US'],
      ['TAMINCO', 'BE', 'GEVERS', 'BE', 'MIRANDAH ASIA', 'US'],
      ['P LAB', 'BE', 'GEVERS', 'BE', 'REMFRY & SAGAR', 'US'],
      ['BIOTALYS', 'BE', 'GEVERS', 'BE', 'DANIEL LAW', 'US'],
      ['UNIVI', 'BE', 'GEVERS', 'BE', 'GORDIOSSKY & PARTNERS', 'US'],
      ['SOUDAL', 'BE', 'GEVERS', 'BE', 'OHITSUKA PATENT OFFICE', 'US'],
      ['CONTOSO IP', 'FR', 'GEVERS', 'BE', 'LAVERY, DE BILLY, LLP', 'CA'],
      ['NOVA TECH', 'DE', 'GEVERS', 'BE', 'MAJMUDAR & PARTNERS', 'AU'],
      ['ALPHA SYSTEMS', 'FR', 'SYMBIOTIC IP', 'AU', 'MAJMUDAR & PARTNERS', 'AU'],
      ['ALPHA SYSTEMS', 'DE', 'SYMBIOTIC IP', 'AU', 'MAJMUDAR & PARTNERS', 'AU'],
      ['OMEGA LABS', 'NL', 'HARBOUR PATENTS', 'AU', 'PATENT ATTORNEYS AUSTRALIA', 'AU'],
      ['EURO CHEM', 'BE', 'HARBOUR PATENTS', 'AU', 'PATENT ATTORNEYS AUSTRALIA', 'AU'],
    ].map(([Applicant, ApplicantCountry, DomesticRepresentative, DomesticCountry, InternationalRepresentative, InternationalCountry]) => ({
      Applicant,
      'Applicant Country': ApplicantCountry,
      'Domestic Representative': DomesticRepresentative,
      'Domestic Country': DomesticCountry,
      'International Representative': InternationalRepresentative,
      'International Country': InternationalCountry,
    })),
  };
}
