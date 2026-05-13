import { prisma } from "./db";
import { TicketStatus, TicketCategory } from "@repo/shared/schemas/ticket";

const subjects = [
  "Unable to log in to my account",
  "Billing charge I don't recognise",
  "How do I export my data?",
  "Feature request: dark mode",
  "App crashes on startup",
  "Password reset email not arriving",
  "Refund request for duplicate order",
  "Integration with Slack not working",
  "How do I add a team member?",
  "Invoice missing company name",
  "Two-factor authentication not working",
  "API rate limit hit unexpectedly",
  "Wrong currency shown on checkout",
  "Can I upgrade mid-cycle?",
  "Webhook not firing on ticket close",
  "Mobile app freezes on iOS 17",
  "How do I change my email address?",
  "Subscription cancelled but still charged",
  "Search results returning incorrect data",
  "SSO setup assistance needed",
  "Data import failed with CSV error",
  "How do I delete my account?",
  "Notification emails going to spam",
  "Discount code not applying",
  "Report shows wrong date range",
  "Can I have a custom domain?",
  "Audit log not showing recent changes",
  "Bulk ticket assignment not working",
  "How do I set business hours?",
  "Agent stats missing from dashboard",
  "Auto-reply not sending",
  "GDPR data export request",
  "Payment method update failed",
  "How do I archive old tickets?",
  "SLA timer not pausing on hold",
  "Widget not loading on Safari",
  "How do I CC a customer on a reply?",
  "Duplicate tickets being created",
  "Custom field values not saving",
  "Email threading broken after migration",
  "How do I merge tickets?",
  "Canned responses not appearing",
  "File attachment limit too low",
  "Ticket priority not saving",
  "How do I set up auto-close?",
  "Keyboard shortcuts not working",
  "Report export takes too long",
  "How do I reassign a ticket?",
  "Tags not syncing across agents",
  "Dashboard widgets missing after update",
];

const firstNames = [
  "Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Hank",
  "Iris", "Jack", "Karen", "Liam", "Mia", "Noah", "Olivia", "Pete",
  "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander",
  "Yara", "Zane", "Anna", "Ben", "Clara", "Dylan",
];

const domains = [
  "gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me",
  "acme.io", "techcorp.dev", "startupco.com", "bigenterprise.org", "freelancer.net",
];

const statuses = Object.values(TicketStatus);
const categories = Object.values(TicketCategory);

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomEmail(index: number): string {
  const firstName = randomElement(firstNames).toLowerCase();
  const domain = randomElement(domains);
  return `${firstName}${index}@${domain}`;
}

function randomDate(): Date {
  // Spread tickets over the last 90 days
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * ninetyDaysMs);
}

async function seedTickets() {
  const COUNT = 100;

  const tickets = Array.from({ length: COUNT }, (_, i) => ({
    fromEmail: randomEmail(i + 1),
    toEmail: "support@helpdesk.example.com",
    subject: subjects[i % subjects.length] + (i >= subjects.length ? ` (#${Math.floor(i / subjects.length) + 1})` : ""),
    body: `Hi, I'm writing in about: ${subjects[i % subjects.length]}. Please help me resolve this as soon as possible. Thanks!`,
    status: randomElement(statuses),
    category: Math.random() > 0.15 ? randomElement(categories) : null,
    createdAt: randomDate(),
  }));

  await prisma.ticket.createMany({ data: tickets });
  console.log(`Created ${COUNT} tickets.`);
  await prisma.$disconnect();
}

seedTickets().catch((err) => {
  console.error(err);
  process.exit(1);
});
