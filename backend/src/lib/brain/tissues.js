'use strict';
/** Five living AI tissues on this kernel. GitHub siblings stay cadavers.
 * Ported from pine-shadow src/lib/brain/tissues.ts */

const TISSUES = [
  {
    id: 'frontier', name: 'Frontier AI', short: 'Frontier',
    thesis: 'The frontier is the pass / block / defer edge: mill, remaining, climate. Named signals. Not a new model.',
    living: 'millDecision names outage, alert, heat. Remaining gate conserves grams. Climate reflex blocks the mill and opens a claim.',
    refuse: 'Do not invent a yield, a premium, or a credit score at the edge.',
    href: '/brain', organ: 'reflex',
  },
  {
    id: 'agentic', name: 'Agentic AI', short: 'Agentic',
    thesis: 'Propose. Clerk approves. Memory of the last harvest. Never a second spine.',
    living: 'Companion ranks harvest / intake / settle. Human command before any consequential write.',
    refuse: 'The companion never executes a rupee write alone.',
    href: '/companion', organ: 'farmer',
  },
  {
    id: 'physical', name: 'Humanoid robots and physical AI', short: 'Physical',
    thesis: 'Physical AI is the mill motor, the IoT reading, the remaining grams in the godown. Not a humanoid.',
    living: 'Declared temp, kWh, remaining mass, mill block. Warehouse is the body.',
    refuse: 'Humanoid teleop refused. Do not fake a robot fleet.',
    href: '/warehouse', organ: 'warehouse',
  },
  {
    id: 'security', name: 'AI security and trust', short: 'Security',
    thesis: 'Firewall, constitution, consent, GI mint. Clerk boundary is the control.',
    living: 'rupeeWrite false. Constitution E1–E9. Eval harness. Consent receipts. Evidence passport.',
    refuse: 'Secrets stay out of the repo. No inferred caste, religion, or health.',
    href: '/charter', organ: 'ai',
  },
  {
    id: 'scientist', name: 'Artificial scientists', short: 'Scientist',
    thesis: 'Hypothesis on declared remaining and loss %. Cite or hide. Never as live rupees.',
    living: 'Farm twin on declared loss %. Policy what-if, amount blank. Library-first eval.',
    refuse: 'Do not invent a yield, a gazette, or a training loop.',
    href: '/library', organ: 'crop',
  },
];

const TISSUE_BY_ID = Object.fromEntries(TISSUES.map((t) => [t.id, t]));

module.exports = { TISSUES, TISSUE_BY_ID };
