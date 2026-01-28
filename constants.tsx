
import { PackageTemplate, Client, TeamMember, ProjectStatus, PaymentStatus } from './types';

export const PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    id: 'drop-essential',
    name: 'DROP ESSENTIAL',
    description: 'Per brand che lanciano il primo drop o testano una nuova idea.',
    price: 597,
    defaultDeadlineDays: 10,
    tasks: [
      { title: 'Briefing iniziale', description: 'Call con il cliente', baseHours: 1, complexity: 'simple', type: 'strategy' },
      { title: 'Creare moodboard', description: 'Ricerca visiva', baseHours: 1, complexity: 'simple', type: 'research' },
      { title: 'Design grafica', description: 'Creazione design', baseHours: 3, complexity: 'medium', type: 'design' },
      { title: 'Revisione con cliente', description: 'Feedback', baseHours: 1, complexity: 'simple', type: 'strategy' },
      { title: 'Creare mockup fronte', description: 'Mockup vista frontale', baseHours: 1.5, complexity: 'medium', type: 'design' },
      { title: 'Creare mockup retro', description: 'Mockup vista retro', baseHours: 1.5, complexity: 'medium', type: 'design' },
      { title: 'Creare mockup dettaglio', description: 'Mockup dettaglio', baseHours: 1.5, complexity: 'medium', type: 'design' },
      { title: 'Creare post social', description: 'Post per Instagram', baseHours: 2, complexity: 'medium', type: 'design' },
      { title: 'Creare stories', description: 'Stories Instagram', baseHours: 0.5, complexity: 'simple', type: 'design' },
      { title: 'Montare reel', description: 'Video breve', baseHours: 2, complexity: 'medium', type: 'filming' },
      { title: 'Consegna finale', description: 'Invio file al cliente', baseHours: 0.5, complexity: 'simple', type: 'delivery' },
    ]
  },
  {
    id: 'drop-growth',
    name: 'DROP GROWTH',
    description: 'Per brand pronti a rilasciare una mini-collezione strutturata.',
    price: 947,
    defaultDeadlineDays: 14,
    tasks: [
      { title: 'Briefing collezione', description: 'Call approfondita', baseHours: 2, complexity: 'medium', type: 'strategy' },
      { title: 'Direzione creativa', description: 'Definire stile', baseHours: 2, complexity: 'medium', type: 'strategy' },
      { title: 'Design articolo 1', description: 'Primo capo', baseHours: 2.5, complexity: 'medium', type: 'design' },
      { title: 'Design articolo 2', description: 'Secondo capo', baseHours: 2.5, complexity: 'medium', type: 'design' },
      { title: 'Design articolo 3', description: 'Terzo capo', baseHours: 2.5, complexity: 'medium', type: 'design' },
      { title: 'Creare mockup (12)', description: '4 per articolo', baseHours: 6, complexity: 'complex', type: 'design' },
      { title: 'Montare reel (4)', description: 'Video per social', baseHours: 4, complexity: 'medium', type: 'filming' },
      { title: 'Piano di lancio', description: 'Strategia posting', baseHours: 1, complexity: 'simple', type: 'strategy' },
      { title: 'Consegna finale', description: 'Invio file', baseHours: 0.5, complexity: 'simple', type: 'delivery' },
    ]
  },
  {
    id: 'drop-brand-experience',
    name: 'DROP BRAND EXPERIENCE',
    description: 'Per brand focalizzati sul posizionamento e l\'identità.',
    price: 1447,
    defaultDeadlineDays: 18,
    tasks: [
      { title: 'Workshop brand', description: 'Definire visione', baseHours: 2, complexity: 'medium', type: 'strategy' },
      { title: 'Concept creativo', description: 'Tema visivo', baseHours: 3, complexity: 'medium', type: 'strategy' },
      { title: 'Creare mockup (20+)', description: 'Mockup premium', baseHours: 10, complexity: 'veryComplex', type: 'design' },
      { title: 'Creare video B-Roll', description: 'Clip cinematiche', baseHours: 5, complexity: 'medium', type: 'filming' },
      { title: 'Piano lancio completo', description: 'Pre/durante/post', baseHours: 3, complexity: 'medium', type: 'strategy' },
      { title: 'Consegna finale', description: 'Invio file', baseHours: 1, complexity: 'simple', type: 'delivery' },
    ]
  },
  {
    id: 'drop-full-launch',
    name: 'DROP FULL LAUNCH',
    description: 'Soluzione completa per brand pronti a scalare.',
    price: 2097,
    defaultDeadlineDays: 21,
    tasks: [
      { title: 'Kickoff strategico', description: 'Definire strategia', baseHours: 2, complexity: 'medium', type: 'strategy' },
      { title: 'Creare mockup (30+)', description: 'Collezione completa', baseHours: 14, complexity: 'veryComplex', type: 'design' },
      { title: 'Creare contenuti social', description: 'Post e ads', baseHours: 6, complexity: 'medium', type: 'content' },
      { title: 'Montare reel (10+)', description: 'Video lancio', baseHours: 8, complexity: 'complex', type: 'filming' },
      { title: 'Copy e landing page', description: 'Testi vendita', baseHours: 4, complexity: 'medium', type: 'content' },
      { title: 'Consulenza finale', description: 'Call strategia', baseHours: 1.5, complexity: 'medium', type: 'strategy' },
    ]
  },
  {
    id: 'brand-starter-identity',
    name: 'BRAND STARTER IDENTITY',
    description: 'Per nuovi brand che partono da zero.',
    price: 397,
    defaultDeadlineDays: 7,
    tasks: [
      { title: 'Briefing brand', description: 'Definire stile', baseHours: 1.5, complexity: 'simple', type: 'strategy' },
      { title: 'Creare moodboard', description: 'Ricerca visiva', baseHours: 1.5, complexity: 'simple', type: 'research' },
      { title: 'Design logo (3 proposte)', description: 'Bozze logo', baseHours: 3, complexity: 'medium', type: 'design' },
      { title: 'Rifinire logo finale', description: 'Logo definitivo', baseHours: 2, complexity: 'medium', type: 'design' },
      { title: 'Definire palette colori', description: 'Colori brand', baseHours: 1, complexity: 'simple', type: 'design' },
      { title: 'Consegna finale', description: 'Invio file', baseHours: 1, complexity: 'simple', type: 'delivery' },
    ]
  },
  {
    id: 'brand-identity-pro',
    name: 'BRAND IDENTITY PRO',
    description: 'Per brand che vogliono un posizionamento più forte.',
    price: 697,
    defaultDeadlineDays: 10,
    tasks: [
      { title: 'Analisi competitor', description: 'Studio mercato', baseHours: 4, complexity: 'medium', type: 'strategy' },
      { title: 'Design logo (3 proposte)', description: 'Logo avanzato', baseHours: 6, complexity: 'complex', type: 'design' },
      { title: 'Creare varianti logo', description: 'Versioni logo', baseHours: 2, complexity: 'medium', type: 'design' },
      { title: 'Definire tono di voce', description: 'Stile comunicazione', baseHours: 2, complexity: 'medium', type: 'strategy' },
      { title: 'Creare template social', description: 'Post e stories', baseHours: 2, complexity: 'medium', type: 'design' },
      { title: 'Consegna finale', description: 'Invio file', baseHours: 1, complexity: 'simple', type: 'delivery' },
    ]
  }
];

export const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Arcidiart', role: 'Direttore Creativo', avatar: 'https://picsum.photos/seed/arcidiart/100', status: 'online', currentTask: 'Concept Design' },
  { id: '2', name: 'Lorenzo', role: 'Lead Designer', avatar: 'https://picsum.photos/seed/lorenzo/100', status: 'online', currentTask: 'Creazione Mockup' },
  { id: '3', name: 'Andrea', role: 'Motion & Video', avatar: 'https://picsum.photos/seed/andrea/100', status: 'offline' },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'James Wilson',
    email: 'james@vervestreet.com',
    company: 'Verve Streetwear',
    contact: '+44 789 123 456',
    packageId: 'drop-essential',
    status: ProjectStatus.ACTIVE,
    startDate: new Date().toISOString(),
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    payments: [{ id: 'p1', amount: 597, date: new Date().toISOString(), method: 'Stripe', invoiceNumber: 'INV-001', status: PaymentStatus.PAID }],
    notes: [
      { id: 'n1', author: 'Arcidiart', content: 'Il cliente preferisce un\'estetica streetwear minimalista con toni terra.', timestamp: new Date().toISOString(), category: 'Feedback' }
    ],
    totalPrice: 597,
    completionPercentage: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Sarah Chen',
    email: 'sarah@aurora.io',
    company: 'Aurora Collective',
    contact: '+1 234 567 890',
    packageId: 'drop-growth',
    status: ProjectStatus.ACTIVE,
    startDate: new Date().toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    payments: [{ id: 'p2', amount: 500, date: new Date().toISOString(), method: 'Bonifico', invoiceNumber: 'INV-002', status: PaymentStatus.PARTIAL }],
    notes: [],
    totalPrice: 947,
    completionPercentage: 0,
    createdAt: new Date().toISOString()
  }
];
