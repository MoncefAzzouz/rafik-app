// Idempotent: creates the four Play-Store-required pages with starter content if
// they don't exist yet. Never overwrites content you've already edited.
//   npx ts-node prisma/ensureLegalPages.ts
import prisma from '../src/lib/prisma';

const DEFAULTS: { slug: string; title: string; content: string }[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

Rafik ("we", "us") operates the Rafik mobile application and services in Algeria.

## Information we collect
- Account details you provide: name, phone number, email.
- Location you enter or share to request a service (taxi, food, home services, freight).
- Usage data needed to operate the service (orders, messages with providers).

## How we use it
We use your information to connect you with service providers, process orders,
provide support, and improve the app. We do not sell your personal data.

## Sharing
We share the minimum necessary details with the provider fulfilling your request
(e.g. your name, pickup/destination, and phone) so they can serve you.

## Your rights
You can edit your profile in the app and request account deletion at any time
from the app or at /delete-account.

## Contact
For any privacy question, contact us via the Support page.

_Last updated: edit this text in the admin → Mobile App → Legal Pages._`,
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    content: `# Terms & Conditions

By using Rafik you agree to these terms.

## The service
Rafik is a marketplace that connects clients with independent service providers
(drivers, restaurants, professionals, freight carriers). Rafik facilitates the
connection; the provider is responsible for the service delivered.

## Payments
Prices are shown before you confirm. Cash and in-app methods may apply depending
on the service. Promo codes are subject to their own conditions.

## Conduct
Do not misuse the platform, submit false information, or harass providers or clients.

## Liability
Rafik is not liable for the acts of independent providers beyond what the law requires.

## Changes
We may update these terms; continued use means you accept the updated terms.

_Last updated: edit this text in the admin → Mobile App → Legal Pages._`,
  },
  {
    slug: 'delete-account',
    title: 'Delete Your Account',
    content: `# Delete Your Account

You can permanently delete your Rafik account and associated personal data.

## From the app
Open the app → Profile → Settings → **Delete account**, then confirm.

## By request
If you can't access the app, contact us from the Support page with the phone
number or email on your account and ask for deletion. We will verify your
identity and delete your account.

## What is removed
Your profile, contact details, and account data are removed. Some records
required by law (e.g. transaction history) may be retained for the legally
required period, then deleted.

_Last updated: edit this text in the admin → Mobile App → Legal Pages._`,
  },
  {
    slug: 'support',
    title: 'Support',
    content: `# Support

Need help with Rafik? We're here.

- **Email:** support@rafik.app
- **Phone / WhatsApp:** +213 000 000 000
- **Hours:** 7 days a week

Describe your issue and include your order number if you have one, and we'll
get back to you as soon as possible.

_Last updated: edit this text in the admin → Mobile App → Legal Pages._`,
  },
];

async function main() {
  let created = 0;
  for (const p of DEFAULTS) {
    const existing = await prisma.appLegalPage.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.appLegalPage.create({ data: p });
      created++;
    }
  }
  const total = await prisma.appLegalPage.count();
  console.log(`Legal pages ensured. Created ${created}. Table now has ${total} pages.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
