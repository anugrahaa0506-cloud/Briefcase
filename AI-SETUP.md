# Briefcase AI integration

This branch adds AI-powered content briefs, content repurposing, and idea development to the existing static Briefcase site.

## Architecture

- Frontend: GitHub Pages, existing HTML/CSS/JavaScript.
- Backend: Cloudflare Worker in `worker/index.js`.
- Model: Gemini API, using a free-tier model when available.

## Deploy the Worker

1. In Cloudflare, create a Worker named `briefcase-ai`.
2. Paste the contents of `worker/index.js` into its editor and deploy.
3. In Worker Settings → Variables and Secrets, add secrets:
   - `GEMINI_API_KEY`: API key from Google AI Studio.
   - `APP_ACCESS_CODE`: a long private passphrase for personal use.
4. Redeploy after adding secrets.
5. Copy the deployed Worker URL.

## Connect the frontend

In `index.html`, find:

```js
const AI_ENDPOINT = "https://YOUR-WORKER-SUBDOMAIN.workers.dev";
```

Replace the placeholder with the actual deployed Worker URL, commit the change, and wait for GitHub Pages to publish.

## Features connected

- Build a Brief → Gemini-powered content brief.
- Repurpose Content → platform-aware rewrite for the selected format.
- Idea Generator → Develop with AI creates seven distinct concepts.

The existing Copy, TXT, PDF, and PNG actions remain in place.

## Security and free-tier notes

- Never commit the Gemini API key to this repository.
- The access code is a lightweight personal-use gate, not robust authentication. Anyone who obtains the code may use the endpoint.
- Origin checks help constrain browser use but do not stop direct HTTP requests. Review Worker logs and quotas.
- Free-tier availability, limits, model names, and data-use terms can change. Review the current Gemini API pricing and terms before sending sensitive or client-owned content.
- This version does not persist AI output on a server. Existing outputs remain in the page until the user leaves or refreshes it.
