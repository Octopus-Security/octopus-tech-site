# OctopusTechnology

The public site. Static HTML in `public/`, served by nginx.

## The projects page

`public/projects.html` is **half generated**. The prose is written by hand; the
facts are read from the repositories.

That split exists because the previous version of this page was entirely
hand-maintained and listed two projects out of thirty-five. Anything a script
can keep true, a script should keep true — but no script can write why a piece
of work was difficult, and for this audience that is the only part worth
reading.

```bash
node tools/build-projects.mjs           # regenerate the cards
node tools/build-projects.mjs --check   # fail if the page is out of date
```

- **Prose** — `content/projects.js`. Edit freely.
- **Facts** — languages, last-updated, commit and test counts, derived from the
  sibling repos in the workspace at build time.
- Only the region between the `PROJECTS:START` / `PROJECTS:END` markers is
  rewritten. Nav, footer, lizard and rat are untouched.

Run it after a stretch of work and commit the result. It needs the sibling
repos checked out, so it runs locally rather than in the image build.

## What does not go on this page

No subdomains, no stack names, no ports, no service topology. The estate is
described, never mapped — a portfolio should not double as reconnaissance.
`content/projects.js` says this too, where someone adding a project will read it.
