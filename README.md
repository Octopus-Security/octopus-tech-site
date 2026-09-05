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

## `backend/` is not part of this site, and never has been

`backend/` and `schema.sql` are an **abandoned prototype**. Nothing builds them
and nothing runs them.

The `Dockerfile` at the root of this repo is `nginx:alpine`; it copies `public/`
and nothing else. There is no Node in the image, `docker-compose.yml` builds
that Dockerfile and passes no environment at all, and `backend/Dockerfile` is
referenced by no compose file in the workspace. The site is static.

What it was: a first cut at the budget tracker — pay periods, expenses,
accounts, debts — with its own user table, its own bcrypt registration and its
own JWT signing. That work moved into a service of its own long ago and grew
well past this, so what is left here is the ancestor, not a component.

**It is kept only as history, and three things about it mislead.**

- It signs its own tokens with `JWT_SECRET`. Single sign-on issues tokens from
  one service and nothing else mints them, so this is the one file in the
  workspace that contradicts that rule — and it turns up in every audit of who
  holds that variable, looking live each time.
- It exposes an unauthenticated `POST /register`. Harmless while nothing builds
  it; a public sign-up outside SSO the moment anything does.
- It has been maintained by accident. The last commit to it bumped Node 18 → 22
  and rebuilt bcrypt against the new image — real work, spent on a Dockerfile
  that is never invoked.

Nothing here is exposed: it hardcodes no credentials and reads everything from
the environment, which is empty for it in any case. Delete it whenever the
history is no longer wanted — git keeps it either way.
