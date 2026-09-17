# Delivery Workflow

For every completed change, use this workflow:

1. Implement the change.
2. Run `npm test` and `npm run build`.
3. Create a Conventional Commit and push it directly to `master` on GitHub.
4. Deploy that exact commit to the Vercel production project.
5. Verify the deployment is `READY` and run a production smoke test.
6. Report the commit, deployment URL, and verification result.

Keep this workflow lightweight: do not require feature branches, pull requests, or GitHub Actions unless the user explicitly asks for them.
