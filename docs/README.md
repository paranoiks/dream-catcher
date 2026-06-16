# docs/

Deep reference for major systems — the **why**, the decision history, and full contracts
that are too long for an `AGENTS.md`. The split:

- **`AGENTS.md`** (root + per area) — operational: invariants, "don't do X", verify commands.
  Auto-loaded by the harness when working in that subtree. Stays dense and actionable.
- **`docs/<system>.md`** — reference: why it's built this way, the contract, the threat model,
  the follow-up backlog. Linked from the relevant `AGENTS.md`; read before changing the model.

Keep the two from drifting: facts that change often (config values, exact IAM, route lists)
stay in code/`AGENTS.md` and are *referenced* here, not duplicated.

## Systems

- [authentication.md](authentication.md) — the `/auth/*` broker: why no client SDK/crypto,
  the endpoint contract, session lifecycle, and the security model.

Candidates not yet written (add when a session touches them deeply): the design system /
token pipeline, navigation, the infra/CI deploy path.
