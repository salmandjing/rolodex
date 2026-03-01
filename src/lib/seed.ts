import { nanoid } from 'nanoid'
import { db, type Contact } from './db'

const now = Date.now()
const hour = 3600000
const day = 86400000

const sampleContacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    company: 'Stripe',
    title: 'Senior Engineer',
    phone: '(415) 555-0142',
    email: 'priya.sharma@stripe.com',
    city: 'San Francisco',
    state: 'CA',
    notes: [
      { id: nanoid(), text: 'Super sharp on distributed systems', createdAt: now - 3 * day },
      { id: nanoid(), text: 'Offered to intro me to their hiring manager', createdAt: now - 7 * day },
      { id: nanoid(), text: 'Met at a payments meetup in SF', createdAt: now - 90 * day },
    ],
    favorite: 1,
  },
  {
    firstName: 'Marcus',
    lastName: 'Chen',
    company: 'Andreessen Horowitz',
    title: 'Partner',
    phone: '(650) 555-0198',
    email: 'marcus@a16z.com',
    city: 'Menlo Park',
    state: 'CA',
    notes: [
      { id: nanoid(), text: 'Interested in developer tools and infra', createdAt: now - 14 * day },
      { id: nanoid(), text: 'Prefers warm intros, follows up fast', createdAt: now - 30 * day },
      { id: nanoid(), text: 'Intro from Priya at a16z office hours', createdAt: now - 120 * day },
    ],
    favorite: 1,
  },
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    company: 'Notion',
    title: 'Head of Product',
    phone: '',
    email: 'sarah.w@notion.so',
    city: 'New York',
    state: 'NY',
    notes: [
      { id: nanoid(), text: 'Helped me refine our onboarding flow', createdAt: now - 15 * day },
      { id: nanoid(), text: 'Great product thinker', createdAt: now - 30 * day },
      { id: nanoid(), text: 'She DMed me on Twitter after our PH launch', createdAt: now - 180 * day },
    ],
    favorite: 0,
  },
  {
    firstName: 'James',
    lastName: 'Okonkwo',
    company: 'Figma',
    title: 'Staff Designer',
    phone: '(212) 555-0177',
    email: 'james.o@figma.com',
    city: 'Brooklyn',
    state: 'NY',
    notes: [
      { id: nanoid(), text: 'Freelances on the side for select projects', createdAt: now - 2 * day },
      { id: nanoid(), text: 'Kids name is Ayo', createdAt: now - 7 * day },
      { id: nanoid(), text: 'Met at design conference in Brooklyn', createdAt: now - 200 * day },
    ],
    favorite: 0,
  },
  {
    firstName: 'Elena',
    lastName: 'Rodriguez',
    company: 'Datadog',
    title: 'Engineering Manager',
    phone: '(512) 555-0133',
    email: 'elena.r@datadoghq.com',
    city: 'Austin',
    state: 'TX',
    notes: [
      { id: nanoid(), text: 'Building out their real-time alerting team', createdAt: now - 10 * day },
      { id: nanoid(), text: 'Looking for senior engineers', createdAt: now - 45 * day },
      { id: nanoid(), text: 'Met at KubeCon 2024', createdAt: now - 150 * day },
    ],
    favorite: 0,
  },
  {
    firstName: 'Alex',
    lastName: 'Kim',
    company: 'Vercel',
    title: 'Developer Advocate',
    phone: '',
    email: 'alex@vercel.com',
    city: 'Seattle',
    state: 'WA',
    notes: [
      { id: nanoid(), text: 'Great for getting early access to Vercel features', createdAt: now - 2 * hour },
      { id: nanoid(), text: 'Super helpful and responsive', createdAt: now - 5 * day },
      { id: nanoid(), text: 'Reviewed my open source PR on Next.js', createdAt: now - 60 * day },
    ],
    favorite: 1,
  },
  {
    firstName: 'Nina',
    lastName: 'Patel',
    company: 'Goldman Sachs',
    title: 'VP, Technology',
    phone: '(212) 555-0201',
    email: 'nina.patel@gs.com',
    city: 'New York',
    state: 'NY',
    notes: [
      { id: nanoid(), text: 'Good perspective on enterprise sales', createdAt: now - 20 * day },
      { id: nanoid(), text: 'Moved from SWE to management track', createdAt: now - 60 * day },
      { id: nanoid(), text: 'College friend, stayed in touch', createdAt: now - 365 * day },
    ],
    favorite: 0,
  },
  {
    firstName: 'Tom',
    lastName: 'Bradley',
    company: '',
    title: 'Freelance Consultant',
    phone: '(303) 555-0156',
    email: 'tom@tombradley.co',
    city: 'Denver',
    state: 'CO',
    notes: [
      { id: nanoid(), text: 'Helps early-stage startups with GTM strategy', createdAt: now - 30 * day },
      { id: nanoid(), text: 'Reasonable rates', createdAt: now - 30 * day },
      { id: nanoid(), text: 'Mutual friend intro at a Denver startup event', createdAt: now - 90 * day },
    ],
    favorite: 0,
  },
]

export async function seedDatabase() {
  const count = await db.contacts.count()
  if (count > 0) return

  const contacts: Contact[] = sampleContacts.map((c, i) => ({
    ...c,
    id: nanoid(),
    createdAt: now - (sampleContacts.length - i) * day,
    updatedAt: now - (sampleContacts.length - i) * day,
  }))

  await db.contacts.bulkAdd(contacts)
}
