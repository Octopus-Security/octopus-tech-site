'use strict';

/**
 * The curated half of the projects page.
 *
 * Facts — languages, when a repo last moved — are derived by
 * tools/build-projects.mjs from the repos themselves, because the previous
 * version of this page was hand-maintained and ended up listing two projects
 * out of thirty-five. Anything a script can keep true, a script should keep
 * true.
 *
 * What a script CANNOT write is why any of it was difficult, and that is the
 * only part a hiring engineer is reading for. A generated repo listing says
 * "octopus-auth · JavaScript · updated Tuesday" and communicates nothing. So
 * `blurb` and `detail` are written by hand and stay written by hand.
 *
 * Rules for what goes in `detail`:
 *   - a decision and its reason, not a feature list
 *   - the constraint that made it awkward, since that is where the judgement is
 *   - no subdomains, no stack names, no service topology — the estate is
 *     described, never mapped. A portfolio should not double as recon.
 *
 * `repo` is the directory name in the workspace, used to derive facts.
 * `url` is the public GitHub link, or null for anything not public.
 */

module.exports = [
  {
    name: 'Octopus Auth',
    repo: 'octopus-auth',
    url: 'https://github.com/Octopus-Security/octopus-auth',
    blurb: 'Single sign-on for a dozen self-hosted services — TOTP, recovery codes, and revocable sessions.',
    detail:
      'Every app behind one login. Two-factor is mandatory and enforced at enrolment, so an '
      + 'account cannot exist without it. Sessions are revocable without storing a single token: '
      + 'each one carries the epoch it was minted under, and bumping a counter on the user orphans '
      + 'all of them at once — no session table, no denylist to prune.\n\n'
      + 'Signing moved from a shared HMAC secret to RS256, because with a shared secret the key '
      + 'that verifies a token also mints one — any of the six services holding it could have '
      + 'forged an admin session. The migration runs live: verification accepts both algorithms '
      + 'at once so week-old sessions keep working, and keys carry an id so rotation needs no '
      + 'flag day. An earlier version of that change refused to boot when half-configured, which '
      + 'turned an incomplete migration into an outage; it now derives what it needs from the key '
      + 'it already has.',
    highlights: [
      'Mandatory TOTP with single-use recovery codes',
      'Session revocation with no server-side session store',
      'Live HS256 → RS256 migration, no forced logout',
      '84 tests, including JWT algorithm-confusion forgery',
    ],
  },
  {
    name: 'Auth Client',
    repo: 'octopus-auth-client',
    url: 'https://github.com/Octopus-Security/octopus-auth-client',
    blurb: 'The shared auth contract, as an installable package with an executable specification.',
    detail:
      'Five services had each written their own copy of "check this session", which is five '
      + 'chances to get one security decision wrong — and the reason a revocation feature could '
      + 'not be rolled out fleet-wide: none of them ran the same code.\n\n'
      + 'The rule that justifies the package: a valid signature does not mean the caller is '
      + 'logged in. The auth service issues short-lived tokens partway through login, signed with '
      + 'the same key, and accepting one as a session would let a stolen password through and '
      + 'defeat two-factor entirely. The test suite is the specification — anyone writing auth '
      + 'without this package has to satisfy the same cases.',
    highlights: [
      'One implementation of the session contract, not five',
      'Tests are the spec; publishing is gated on them',
      'Fails closed when the authority is unreachable',
    ],
  },
  {
    name: 'Octopus EDM',
    repo: 'octopus-edm',
    url: 'https://github.com/Octopus-Security/octopus-edm',
    blurb: 'A browser music workstation with neural synthesis and a live round-trip into FL Studio.',
    detail:
      'Step sequencer, piano roll, mixer and sample browser built on the Web Audio API, with '
      + 'lookahead scheduling so timing survives the main thread being busy. Sample search is '
      + 'semantic rather than filename matching — an audio-text embedding model indexes the '
      + 'library, so "dark supersaw" finds one.\n\n'
      + 'It talks to FL Studio through its piano-roll scripting API, with a shared pattern '
      + 'document as the source of truth so edits compose in either direction. There is also a '
      + 'MIDI file writer implemented from the specification rather than pulled from a library, '
      + 'which matters more than it sounds: note-off has to sort before note-on when one note '
      + 'ends exactly where the next begins, or the file plays one long stuck note. It is '
      + 'installable to a phone and works offline.',
    highlights: [
      'Web Audio lookahead scheduler',
      'Semantic sample search via audio-text embeddings',
      'Standard MIDI File writer, no dependencies',
      'Installable PWA with an auth-safe service worker',
    ],
  },
  {
    name: 'Octopus Cortex',
    repo: 'octopus-cortex',
    url: null,
    blurb: 'An AI assistant with real tools, reachable from Discord and the web.',
    detail:
      'Not a chat wrapper. It plans, calls tools against the actual estate, and reports what it '
      + 'did — file operations, service checks, generating musical patterns that land in the '
      + 'workstation above. The interesting problems are the unglamorous ones: attributing work '
      + 'to the right account when a bot acts on someone\'s behalf, and making sure a request '
      + 'that fails does not take the process down with it.',
    highlights: [
      'Tool-calling orchestration with a planning step',
      'Discord and web share one implementation',
      'Per-user attribution for actions taken by a bot',
    ],
  },
  {
    name: 'Octopus Shopper',
    repo: 'octopus-shopper',
    url: 'https://github.com/Octopus-Security/octopus-shopper',
    blurb: 'Recipe parsing and grocery price comparison across several retailers.',
    detail:
      'Parses a recipe from a URL or a block of pasted text into structured ingredients, then '
      + 'prices it. Some retailers have a signed API; others need a headless browser, which is '
      + 'slower and far more fragile, so the two paths are kept clearly separate.\n\n'
      + 'Most of the real work has been in the data. Ingredients arrived in three different '
      + 'shapes from three eras of the code and 176 rows were invisible because of it. Quantities '
      + 'are stored as text, because "1 ½" and "to taste" are not numbers and the numeric column '
      + 'silently lost them.',
    highlights: [
      'Signed retailer APIs plus headless-browser fallback',
      'LLM recipe parsing into a structured schema',
      'Migrations that reconcile three historical data shapes',
    ],
  },
  {
    name: 'The estate',
    repo: null,
    url: null,
    blurb: 'Roughly a dozen containerised services on NixOS, deployed from git.',
    detail:
      'A declarative host running containerised services, deployed by pulling from git rather '
      + 'than by anyone SSHing in — including an operations service that drives redeployments '
      + 'through the orchestrator\'s API and rotates credentials across stacks.\n\n'
      + 'The lesson that cost the most: a variable set in the orchestrator only reaches a '
      + 'container if the compose file names it. Configuration that looks correct in the UI and '
      + 'never arrives is a genuinely nasty class of bug, because nothing errors — the service '
      + 'simply keeps using the old default while you believe you changed it.',
    highlights: [
      'NixOS host, git-managed container stacks',
      'Redeploys and credential rotation over the orchestrator API',
      'Everything behind one SSO provider',
    ],
  },
  {
    name: 'Alfred',
    repo: 'alfred-js',
    url: 'https://github.com/anonymous14386/alfred-psychopathy',
    blurb: 'The Discord bot this all started as.',
    detail:
      'Where the estate began, and still running. Kept on the page because the distance between '
      + 'this and the auth service is the actual story.',
    highlights: [],
  },
];
