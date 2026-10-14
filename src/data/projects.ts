/**
 * Everything the homepage and the case-study pages say about each project.
 *
 * Rules this file follows (keep them):
 *  - Only claims you can point to in code. No invented metrics.
 *  - Optional fields that are left out are simply not rendered.
 *  - `history` drives the scroll-scrubbed timeline on each case study.
 *    The stages below describe real capabilities, but they are not yet
 *    tied to commits: add `sha`, `date` and `href` from `git log` when you
 *    can, and set `mine: true` only on work you authored.
 */

export type Layer = 'ui' | 'api' | 'data';

export interface DrawingStep {
  tag: string;
  title: string;
  note?: string;
  emphasis?: boolean;
}

export interface Drawing {
  /** Drawing number shown in the figure's title strip, e.g. CC-001. */
  id: string;
  title: string;
  steps: DrawingStep[];
  /** A second path that runs separately (dashed). */
  prepared?: { label: string; steps: string[] };
  caption: string;
}

export interface Decision {
  title: string;
  body: string;
  evidence?: { label: string; href: string };
}

export interface Built {
  title: string;
  detail?: string;
  path?: string;
  href?: string;
}

/** A small drawn stand-in for a screenshot, in the site's own style. */
export type Screen =
  | { kind: 'list'; heading: string; rows: { label: string; note?: string; tag?: string; lit?: boolean }[] }
  | { kind: 'chat'; heading: string; messages: { from: 'user' | 'ai' | 'agent' | 'system'; text: string }[] }
  | { kind: 'flow'; heading: string; nodes: { label: string; lit?: boolean }[] }
  | { kind: 'cards'; heading: string; cards: { label: string; lit?: boolean }[] };

export interface Milestone {
  label: string;
  title: string;
  summary: string;
  diff: { op: '+' | '-'; text: string }[];
  screen: Screen;
  /** Path under /public, e.g. '/shots/supo-handoff.webp'. Replaces the drawn screen. */
  image?: string;
  imageAlt?: string;
  mine?: boolean;
  date?: string;
  sha?: string;
  href?: string;
}

/** A real capture of the project's public page. */
export interface Shot {
  /** Path under /public, e.g. '/shots/supo.jpg'. 1280×800. */
  src: string;
  alt: string;
  /** Month the capture was taken, e.g. 'Oct 2026'. */
  captured: string;
}

export interface Project {
  slug: string;
  fig: string;
  name: string;
  /** Optional manual line breaks for the large display title. */
  nameLines?: string[];
  category: string;
  layer: Layer;
  tagline: string;
  summary: string;
  stack: string[];
  status?: string;
  role: string;
  team?: string;
  timeline?: string;
  live?: string;
  source?: string;
  shot?: Shot;
  drawing: Drawing;
  problem: string[];
  decisions: Decision[];
  built: Built[];
  history: Milestone[];
  limits: string;
  credits?: string;
}

export interface BenchItem {
  name: string;
  summary: string;
  stack: string;
  status: string;
  href?: string;
}

const CC_SRC = 'https://github.com/TahubCS/Context-Compiler/blob/6b6a0f8d395d9cde51f9a7ff40daab24dfc4ca72';
const CG_SRC = 'https://github.com/TahubCS/cognigraph/blob/54613848a6a1bc03fb5cb5ff8ee2974af225bc72';

export const projects: Project[] = [
  {
    slug: 'context-compiler',
    fig: '01',
    name: 'Context Compiler',
    nameLines: ['Context', 'Compiler'],
    category: 'Developer tools / Retrieval',
    layer: 'data',
    tagline: 'The right repository context, in the hands of your AI agent.',
    summary:
      'A web app and local MCP bridge make indexed code searchable by agents. The hard part is choosing a useful working set without hiding where it came from.',
    stack: ['TypeScript', 'Python', 'MCP', 'pgvector'],
    status: 'Live',
    role: 'Hybrid code retrieval, the Python search endpoint, MCP tracing and result selection',
    live: 'https://context-compiler.muhammadtahubkhatri.dev/',
    source: 'https://github.com/TahubCS/Context-Compiler',
    shot: {
      src: '/shots/context-compiler.jpg',
      alt: 'Context Compiler landing page with the headline “Stop guessing which files to paste into your AI.”',
      captured: 'Oct 2026',
    },
    drawing: {
      id: 'CC-001',
      title: 'Request path · query → context',
      steps: [
        { tag: '01 · Local', title: 'MCP client', note: 'calls search_codebase' },
        { tag: '02 · Local', title: 'stdio bridge', note: 'forwards over HTTPS' },
        { tag: '03 · Next.js API', title: 'Resolve access', note: 'bearer key → bound repo; invalid keys stop here', emphasis: true },
        { tag: '04 · FastAPI', title: 'Embed the query', note: 'Gemini embeddings' },
        { tag: '05 · Postgres', title: 'Hybrid retrieval', note: 'semantic + lexical, ranked' },
        { tag: '06 · Out', title: 'Context pack', note: 'paths, excerpts, selection metadata' },
      ],
      prepared: { label: 'Index path', steps: ['GitHub repo', 'scan', 'chunk', 'embed', 'repository index'] },
      caption: 'Index preparation and query handling are separate paths. The repository is never re-cloned per request.',
    },
    problem: [
      'Coding agents are only as good as what they can see. Give them a whole repository and the useful parts drown; give them too little and they guess.',
      'Context Compiler indexes a repository once, then answers an agent’s natural-language question with a small working set: file paths, excerpts, and the metadata that explains why each piece was selected.',
    ],
    decisions: [
      {
        title: 'Combine semantic and lexical candidates',
        body: 'Code questions mix ideas (“where is access resolved?”) with exact names (authenticateMcpRequest). Ranking both kinds of match together catches what either misses alone.',
        evidence: { label: 'vector_store.py', href: `${CC_SRC}/ai-backend/vector_store.py` },
      },
      {
        title: 'Index once, query many times',
        body: 'Scanning, chunking and embedding run separately from search. A query hits an existing index, so a request never waits on a fresh clone.',
        evidence: { label: 'main.py', href: `${CC_SRC}/ai-backend/main.py` },
      },
      {
        title: 'Fail visibly, never fake an answer',
        body: 'An invalid or revoked key stops at authentication. An empty search returns no matches. Neither outcome is dressed up as a generated answer.',
        evidence: { label: 'route.ts', href: `${CC_SRC}/src/app/api/mcp/search/route.ts` },
      },
      {
        title: 'Run the Python service on Fly.io',
        body: 'The FastAPI backend moved off Render to remove the cold-start delay an agent would otherwise feel on its first call.',
      },
    ],
    built: [
      { title: 'Hybrid code retrieval', path: 'ai-backend/vector_store.py', href: `${CC_SRC}/ai-backend/vector_store.py` },
      { title: 'Python search endpoint', path: 'ai-backend/main.py', href: `${CC_SRC}/ai-backend/main.py` },
      { title: 'MCP tracing & result selection', path: 'src/lib/repository-retrieval.ts', href: `${CC_SRC}/src/lib/repository-retrieval.ts` },
    ],
    history: [
      {
        label: 'Stage 1',
        title: 'A repository becomes an index',
        summary: 'Repositories are scanned, chunked and embedded ahead of time, so search has something to search.',
        diff: [
          { op: '+', text: 'scan → chunk → embed' },
          { op: '+', text: 'store vectors in Postgres (pgvector)' },
        ],
        screen: { kind: 'flow', heading: 'Index path', nodes: [{ label: 'GitHub' }, { label: 'scan' }, { label: 'chunk' }, { label: 'embed', lit: true }, { label: 'index' }] },
      },
      {
        label: 'Stage 2',
        title: 'Agents can ask through MCP',
        summary: 'A local stdio bridge exposes search_codebase to any MCP client and forwards calls to the app over HTTPS.',
        diff: [
          { op: '+', text: 'src/mcp/server.ts — search_codebase tool' },
          { op: '+', text: 'bearer key → bound repository' },
        ],
        screen: { kind: 'flow', heading: 'Request path', nodes: [{ label: 'MCP client' }, { label: 'bridge' }, { label: 'API', lit: true }] },
      },
      {
        label: 'Stage 3',
        title: 'Hybrid retrieval',
        summary: 'Semantic and lexical candidates are combined and ranked, and every result carries the reason it was selected.',
        diff: [
          { op: '-', text: 'semantic matches only' },
          { op: '+', text: 'semantic + lexical candidates, ranked' },
          { op: '+', text: 'selection metadata on each result' },
        ],
        mine: true,
        screen: {
          kind: 'list',
          heading: '“Where is access resolved?”',
          rows: [
            { label: 'src/app/api/mcp/search/route.ts', note: 'auth → repository scope', tag: 'lexical + semantic', lit: true },
            { label: 'src/mcp/server.ts', note: 'tool invocation', tag: 'semantic' },
            { label: 'ai-backend/vector_store.py', note: 'candidate ranking', tag: 'lexical' },
          ],
        },
      },
      {
        label: 'Stage 4',
        title: 'No cold starts',
        summary: 'The Python service moved to Fly.io so an agent’s first call is as fast as its tenth.',
        diff: [
          { op: '-', text: 'Render (sleeps when idle)' },
          { op: '+', text: 'Fly.io, to remove cold starts' },
        ],
        screen: { kind: 'cards', heading: 'Deploy', cards: [{ label: 'Next.js · Vercel' }, { label: 'FastAPI · Fly.io', lit: true }, { label: 'Postgres · pgvector' }] },
      },
    ],
    limits:
      'Search reflects whatever was indexed, so a stale index returns stale context. Feature-flow suggestions are a reading aid, not proof of what runs at runtime. No latency or ranking-quality numbers are claimed because none have been measured.',
  },
  {
    slug: 'supo',
    fig: '02',
    name: 'Supo',
    category: 'Support systems / SDK',
    layer: 'ui',
    tagline: 'AI support that knows when to bring a person into the conversation.',
    summary:
      'A published browser widget streams answers from product knowledge and hands off to a human agent without losing the thread. React and headless entry points let the host app decide how much UI it owns.',
    stack: ['TypeScript', 'Next.js', 'AI SDK', 'PostgreSQL', 'Ably'],
    status: 'Alpha',
    role: 'Stable customer identity in the widget SDK; agent notifications in the chat flow',
    live: 'https://supo.muhammadtahubkhatri.dev/',
    source: 'https://github.com/TahubCS/Supo',
    drawing: {
      id: 'SP-002',
      title: 'Conversation · AI → human, same thread',
      steps: [
        { tag: 'T+0', title: 'Customer asks', note: 'widget · stable identity' },
        { tag: 'T+1', title: 'Knowledge retrieved', note: 'product context' },
        { tag: 'T+2', title: 'Reply streams', note: 'AI SDK' },
        { tag: 'T+3', title: 'Human takes over', note: 'agent notified · Ably', emphasis: true },
      ],
      caption: 'Keep the context. Change the responder.',
    },
    problem: [
      'Most support bots fail the same way: they keep answering after they’ve stopped helping. The customer asks for a person, gets transferred, and explains everything again to someone who can’t see what the bot said.',
      'Supo starts from the other end. The AI handles what product knowledge can answer, and when it can’t, the conversation changes hands — same thread, same history, new responder.',
    ],
    decisions: [
      {
        title: 'The thread survives the handoff',
        body: 'A human agent joins the existing conversation instead of starting a new ticket, so the customer never repeats themselves.',
      },
      {
        title: 'Identity before intelligence',
        body: 'The widget SDK keeps a stable customer identity, so a returning visitor reconnects to their own conversation rather than opening a blank one.',
      },
      {
        title: 'Notify people in real time',
        body: 'When a conversation needs a person, an agent hears about it immediately over a real-time channel, and the customer is told someone is coming.',
      },
      {
        title: 'Two entry points',
        body: 'A React component for hosts that want a drop-in widget, and a headless client for hosts that want to own every pixel.',
      },
    ],
    built: [
      { title: 'Stable customer identity', detail: 'published widget SDK' },
      { title: 'Agent notifications', detail: 'chat handoff flow' },
    ],
    history: [
      {
        label: 'Stage 1',
        title: 'A widget that answers',
        summary: 'The widget mounts on a host page and returns a model reply.',
        diff: [
          { op: '+', text: 'widget mounts on the host page' },
          { op: '+', text: 'message → model reply' },
        ],
        screen: { kind: 'chat', heading: 'Support', messages: [{ from: 'user', text: 'hi — quick question' }, { from: 'ai', text: 'Hello! How can I help?' }] },
      },
      {
        label: 'Stage 2',
        title: 'Answers come from product knowledge',
        summary: 'Replies are grounded in the product’s own knowledge and stream as they are generated.',
        diff: [
          { op: '-', text: 'generic model reply' },
          { op: '+', text: 'retrieve product knowledge, then stream' },
        ],
        screen: { kind: 'chat', heading: 'Support', messages: [{ from: 'user', text: 'Can I switch to the annual plan?' }, { from: 'ai', text: 'Yes — your remaining days are credited toward…' }] },
      },
      {
        label: 'Stage 3',
        title: 'A person can take over',
        summary: 'Stable identity plus real-time notifications make the AI-to-human handoff possible without losing the thread.',
        diff: [
          { op: '+', text: 'stable customer identity in the SDK' },
          { op: '+', text: 'notify an agent on handoff' },
        ],
        mine: true,
        screen: {
          kind: 'chat',
          heading: 'Support',
          messages: [
            { from: 'user', text: 'I was charged twice this month.' },
            { from: 'system', text: 'A support agent is joining this conversation' },
            { from: 'agent', text: 'I can see the whole thread — let’s sort the charge first.' },
          ],
        },
      },
      {
        label: 'Stage 4',
        title: 'Hosts choose how much UI they own',
        summary: 'The SDK ships as a React component and as a headless client.',
        diff: [
          { op: '+', text: 'React entry point' },
          { op: '+', text: 'headless entry point' },
        ],
        screen: { kind: 'cards', heading: 'Entry points', cards: [{ label: 'React widget', lit: true }, { label: 'Headless client' }] },
      },
    ],
    limits:
      'Supo is an alpha. There are no resolution rates, uptime figures or customer counts here, because none have been measured.',
  },
  {
    slug: 'crowsnest',
    fig: '03',
    name: 'CrowsNest',
    category: 'Collaborative learning / AI',
    layer: 'api',
    tagline: 'Shared course materials become a starting point for better study.',
    summary:
      'Course-specific retrieval turns uploaded material into flashcards, practice questions, study plans and tutor conversations. Hackathon-winning team project.',
    stack: ['Next.js', 'FastAPI', 'Supabase', 'Gemini'],
    status: 'Hackathon winner',
    role: 'Database and study-plan features, shared study resources, the streaming AI tutor',
    team: 'Team project',
    live: 'https://crowsnest.muhammadtahubkhatri.dev/',
    source: 'https://github.com/TahubCS/TheCrowsNest',
    shot: {
      src: '/shots/crowsnest.jpg',
      alt: 'The Crow’s Nest sign-in page, with log in and sign up buttons for ECU students.',
      captured: 'Oct 2026',
    },
    drawing: {
      id: 'CN-003',
      title: 'One source → four ways to study',
      steps: [
        { tag: 'In', title: 'Course materials', note: 'shared by the class' },
        { tag: 'AI service', title: 'Extract & review', note: 'FastAPI' },
        { tag: 'AI service', title: 'Class retrieval', note: 'scoped to one course', emphasis: true },
        { tag: 'Out', title: 'Study tools', note: 'flashcards · practice · plans · tutor' },
      ],
      caption: 'From a shared material to class-specific study context.',
    },
    problem: [
      'Students in the same class upload the same slides, notes and handouts, then study from them alone. CrowsNest treats those materials as one shared source and builds study tools from it, so everyone learns from the same thing.',
      'Retrieval is scoped to the class: a question about one course only draws on that course’s material.',
    ],
    decisions: [
      {
        title: 'Scope retrieval to the class',
        body: 'Materials are retrieved per course, so answers and generated questions stay inside what that class actually covered.',
      },
      {
        title: 'Keep AI work in a Python service',
        body: 'The Next.js app handles people and classes; a separate FastAPI service handles extraction, retrieval and generation.',
      },
      {
        title: 'Stream the tutor',
        body: 'Tutor replies arrive token by token, so a student starts reading immediately instead of watching a spinner.',
      },
      {
        title: 'Treat generated material as a draft',
        body: 'Generated flashcards and questions can be wrong, so they are presented as material to check against the source.',
      },
    ],
    built: [
      { title: 'Database & study plans', detail: 'schema for classes, materials and plans' },
      { title: 'Shared study resources', detail: 'one upload, the whole class' },
      { title: 'Streaming AI tutor', detail: 'grounded in class material' },
    ],
    history: [
      {
        label: 'Stage 1',
        title: 'Classes and shared materials',
        summary: 'Students join a class and upload materials the whole class can use.',
        diff: [
          { op: '+', text: 'classes, members, shared materials' },
          { op: '+', text: 'Supabase schema' },
        ],
        mine: true,
        screen: { kind: 'list', heading: 'CSCI 3010 · materials', rows: [{ label: 'lecture-07.pdf', note: 'transport layer', lit: true }, { label: 'lecture-06.pdf', note: 'sockets' }, { label: 'shared-notes.md', note: 'class notes' }] },
      },
      {
        label: 'Stage 2',
        title: 'Retrieval per class',
        summary: 'A Python service extracts the materials and retrieves only from the active class.',
        diff: [
          { op: '+', text: 'FastAPI extraction service' },
          { op: '+', text: 'class-scoped retrieval' },
        ],
        screen: { kind: 'flow', heading: 'Pipeline', nodes: [{ label: 'materials' }, { label: 'extract' }, { label: 'retrieve', lit: true }, { label: 'study' }] },
      },
      {
        label: 'Stage 3',
        title: 'Four ways to study',
        summary: 'The same source becomes flashcards, practice questions and a study plan.',
        diff: [
          { op: '+', text: 'flashcards · practice questions' },
          { op: '+', text: 'study plans' },
        ],
        mine: true,
        screen: { kind: 'cards', heading: 'Study', cards: [{ label: 'Flashcards' }, { label: 'Practice' }, { label: 'Study plan', lit: true }, { label: 'Tutor' }] },
      },
      {
        label: 'Stage 4',
        title: 'A tutor that streams',
        summary: 'Students can ask questions and read the answer as it is written, grounded in their class.',
        diff: [{ op: '+', text: 'streaming tutor replies' }],
        mine: true,
        screen: {
          kind: 'chat',
          heading: 'Tutor · CSCI 3010',
          messages: [
            { from: 'user', text: 'Why does TCP need a three-way handshake?' },
            { from: 'ai', text: 'Both sides agree on starting sequence numbers before data flows…' },
          ],
        },
      },
    ],
    limits: 'Generated learning materials need review against the source. No accuracy figures are claimed.',
    credits: 'Built with a team. Interface and animation work includes contributions from JacobGittHub.',
  },
  {
    slug: 'cognigraph',
    fig: '04',
    name: 'CogniGraph',
    nameLines: ['Cogni', 'Graph'],
    category: 'Document intelligence / Graph RAG',
    layer: 'data',
    tagline: 'Documents become a graph you can explore, then question.',
    summary:
      'Uploaded documents are chunked, embedded and mined for entities and relationships. The chat draws on both the matching passages and the graph around them, and the graph itself is on screen to inspect.',
    stack: ['Next.js', 'FastAPI', 'pgvector', 'OpenAI', 'S3'],
    status: 'Web app live',
    role: 'Solo build: the Next.js workspace, the FastAPI processing worker, retrieval and the graph view',
    live: 'https://v0-cognigraph.vercel.app/',
    source: 'https://github.com/TahubCS/cognigraph',
    shot: {
      src: '/shots/cognigraph.jpg',
      alt: 'CogniGraph landing page with the headline “Turn scattered documents into connected answers” beside a sample knowledge graph.',
      captured: 'Oct 2026',
    },
    drawing: {
      id: 'CG-004',
      title: 'Question path · query → grounded answer',
      steps: [
        { tag: '01 · Browser', title: 'Ask a question', note: 'chat or split view' },
        { tag: '02 · Next.js API', title: 'Resolve the user', note: 'Clerk session → that user’s documents only' },
        { tag: '03 · OpenAI', title: 'Embed the query', note: 'text-embedding-3-small' },
        { tag: '04 · Postgres', title: 'Passages + relationships', note: 'pgvector similarity and graph lookups', emphasis: true },
        { tag: '05 · Out', title: 'Streamed answer', note: 'AI SDK' },
      ],
      prepared: { label: 'Ingestion path', steps: ['upload → S3', 'extract / OCR', 'chunk', 'embed', 'entities + edges'] },
      caption: 'Documents are processed once by a separate worker. A question only reads what is already stored.',
    },
    problem: [
      'Search works when you know what you are looking for. It is much weaker at the harder question: how do the people, events and claims across a pile of documents connect?',
      'CogniGraph answers from the documents instead of from model memory, and puts the extracted graph on screen, so the context behind an answer can be inspected rather than taken on trust.',
    ],
    decisions: [
      {
        title: 'Upload straight to storage',
        body: 'The browser sends a file to S3 through a presigned URL that expires after 60 seconds, so documents never pass through the web server.',
        evidence: { label: 'storage.ts', href: `${CG_SRC}/src/actions/storage.ts` },
      },
      {
        title: 'Process outside the request',
        body: 'A FastAPI worker runs extraction as a background task and records each document as processing, completed or failed, so a slow file never holds a page open.',
        evidence: { label: 'main.py', href: `${CG_SRC}/python_service/main.py` },
      },
      {
        title: 'Chunk by domain',
        body: 'Nine document modes, from legal to engineering, each set their own chunk size (800 to 2,500 characters) and overlap, and steer what the graph extraction looks for.',
        evidence: { label: 'main.py', href: `${CG_SRC}/python_service/main.py` },
      },
      {
        title: 'Retrieve from the vectors and the graph',
        body: 'A question pulls the closest passages by embedding similarity and the relationships whose entities match it, both limited to the signed-in user’s documents.',
        evidence: { label: 'route.ts', href: `${CG_SRC}/src/app/api/chat/route.ts` },
      },
    ],
    built: [
      { title: 'Document processing worker', path: 'python_service/main.py', href: `${CG_SRC}/python_service/main.py` },
      { title: 'Retrieval & streaming chat', path: 'src/app/api/chat/route.ts', href: `${CG_SRC}/src/app/api/chat/route.ts` },
      { title: 'Presigned uploads', path: 'src/actions/storage.ts', href: `${CG_SRC}/src/actions/storage.ts` },
      {
        title: 'Interactive graph view',
        path: 'src/components/GraphVisualization.tsx',
        href: `${CG_SRC}/src/components/GraphVisualization.tsx`,
      },
    ],
    history: [
      {
        label: 'Stage 1',
        title: 'Documents get in',
        summary: 'Files upload directly to S3, and a worker extracts their text, with OCR for images.',
        diff: [
          { op: '+', text: 'presigned S3 upload' },
          { op: '+', text: 'FastAPI worker: extract text / OCR' },
        ],
        mine: true,
        screen: {
          kind: 'list',
          heading: 'Documents',
          rows: [
            { label: 'q3-report.pdf', note: 'financial', tag: 'processing', lit: true },
            { label: 'supplier-contract.pdf', note: 'legal', tag: 'completed' },
            { label: 'meeting-notes.txt', note: 'general', tag: 'completed' },
          ],
        },
      },
      {
        label: 'Stage 2',
        title: 'Text becomes vectors',
        summary: 'Each document is chunked by its domain mode, embedded, and stored in Postgres with pgvector.',
        diff: [
          { op: '+', text: 'domain-aware chunk size and overlap' },
          { op: '+', text: 'embeddings → pgvector' },
        ],
        mine: true,
        screen: { kind: 'flow', heading: 'Ingestion path', nodes: [{ label: 'S3' }, { label: 'extract' }, { label: 'chunk', lit: true }, { label: 'embed' }, { label: 'Postgres' }] },
      },
      {
        label: 'Stage 3',
        title: 'Text becomes a graph',
        summary: 'Entities and the relationships between them are extracted per document and drawn as a graph you can filter and inspect.',
        diff: [
          { op: '+', text: 'entity + relationship extraction → nodes, edges' },
          { op: '+', text: 'force-directed graph view' },
        ],
        mine: true,
        screen: { kind: 'cards', heading: 'Graph · 3 of 12 nodes', cards: [{ label: 'Supplier' }, { label: 'Contract', lit: true }, { label: 'Renewal date' }] },
      },
      {
        label: 'Stage 4',
        title: 'Answers grounded in both',
        summary: 'Chat retrieves passages and relationships together and streams the reply.',
        diff: [
          { op: '-', text: 'passages only' },
          { op: '+', text: 'passages + graph relationships' },
          { op: '+', text: 'streamed replies' },
        ],
        mine: true,
        screen: {
          kind: 'chat',
          heading: 'Ask your sources',
          messages: [
            { from: 'user', text: 'Which contracts renew before the Q3 report is due?' },
            { from: 'ai', text: 'Two are linked to a renewal date in that window…' },
          ],
        },
      },
    ],
    limits:
      'There is no automated test suite yet, and answers do not carry sentence-level citations. Uploaded content goes to third-party storage and AI providers. The link is the web app; document processing runs in a separate worker. No retrieval-quality numbers are claimed because none have been measured.',
  },
];

export const bench: BenchItem[] = [
  {
    name: 'Reeflect',
    summary:
      'Personal finance for everyday people, with an iMessage agent built on Photon and Capital One’s Nessie data. HackNC 2026, team of three.',
    stack: 'Next.js / Drizzle / Neon / Gemini',
    status: 'In progress',
    href: 'https://reeflect.app/',
  },
  {
    name: 'SpecThread',
    summary:
      'Connects software requirements to the GitHub commits, pull requests, automated tests and releases that implement them, so every feature request has evidence behind it. Software engineering capstone, built with a team.',
    stack: 'Capstone',
    status: 'In progress',
    href: 'https://spec-thread.com/',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function nextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length]!;
}

export const layerNames: Record<Layer, { code: string; name: string; note: string }> = {
  ui: { code: 'A', name: 'Interface', note: 'what a person sees' },
  api: { code: 'B', name: 'API', note: 'who may ask what' },
  data: { code: 'C', name: 'Data', note: 'what gets retrieved' },
};
