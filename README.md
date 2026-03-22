# System Handbook

## GOAT Orchestrator

- **Goals (goals/)** — Process definitions (what needs to happen)
- **Orchestration** — The AI manager (you) that coordinates execution
- **Tools (tools/)** — Deterministic scripts that do the actual work
- **Context (context/)** — Reference material and domain knowledge
- **Hard Prompts (hardprompts/)** — Reusable instruction templates
- **Args (args/)** — Behavior settings that shape how the system acts

> LLMs are probabilistic. Business logic is deterministic.
> You make smart decisions. Tools execute perfectly.

---

# File Structure

- **goals/** — Process definitions → `goals/manifest.md` for index
- **tools/** — Execution scripts → `tools/manifest.md` for index
- **args/** — Behavior settings (YAML/JSON)
- **context/** — Domain knowledge (static reference material)
- **hardprompts/** — Instruction templates
- **.tmp/** — Disposable scratch work. Never store important data here.
- **.env** — API keys + environment variables

---

# How to Operate

- Read **PLANNING.md** at the start of a conversation for architecture, goals, style, and constraints.
- Check **TASK.md** before starting work. Add new tasks with today's date. Mark tasks done immediately after finishing. ADD SCREENSHOTS OF THE WORK DONE IN THE TASK.MD FILE.
- Check **goals/manifest.md** for an existing workflow before starting a task. If one exists, follow it.
- Check **tools/manifest.md** before writing new code. If a tool exists, use it. If you create one, add it to the manifest.
- Use **tsx** or **ts-node** for all TypeScript execution, including tests.
- Use **dotenv** and `dotenv.config()` for environment variables.
- Never modify or create goals without explicit permission.
- Add all discovered sub-tasks to **TASK.md** under **"Discovered During Work"**.

---

# When Tools Fail — Continuous Improvement Loop

- Read the error and stack trace carefully.
- Update the tool to handle the issue (ask if API credits are required).
- Test until it works reliably.
- Add what you learned to the goal (rate limits, batching rules, timing quirks).
- If a goal exceeds a reasonable length, propose splitting it.
- **Always log significant errors to the `ERROR/` directory and update tracking documents.** (e.g., `Module not found` tsconfig mapping issue).

---

# When Stuck

- Explain what's missing and what you need.
- Do not guess or invent capabilities.

---

# Guardrails — Learned Behaviors

- Verify tool output format before chaining into another tool.
- Don't assume APIs support batch operations — check first.
- When a workflow fails mid-execution, preserve intermediate outputs before retrying.
- Read the full goal before starting a task — don't skim.

*(Add new guardrails as mistakes happen. Keep under 15 items.)*

---

# Tone and Behavior

- Criticism is welcome. Tell me when I'm wrong or when there's a better approach.
- Be skeptical.
- Be concise. No flattery. No extended breakdowns unless working through plan details.
- Ask questions when in doubt. Don't guess intent. Never assume missing context.
- Never hallucinate libraries or functions.
- Confirm file paths and module names exist before referencing them.
- Never delete or overwrite existing code unless explicitly instructed or part of a TASK.md task.

---

# Code Style & Conventions

- **TypeScript** as the primary language. Use **strict mode**, enforce **ESLint** with recommended rules, format with **Prettier**.
- **Zod** for data validation. **Hono** or **Express** for APIs. **Prisma** or **Drizzle** for ORM.
- **JSDoc** comments for every function.
- Never create a file longer than **500 lines**. Split into modules when approaching the limit.
- Prefer **ES modules** (`import`/`export`). No `require()` unless interfacing with legacy CJS.
- Always define explicit return types on functions. Avoid `any` — use `unknown` and narrow.

### Organize by feature/responsibility (For agents)

- `agent.ts` — Main agent definition and execution
- `tools.ts` — Tool functions
- `prompts.ts` — System prompts

- Prefer **relative imports within packages**.

---

# Testing

- **Vitest** for all new features. Tests live in `/tests` mirroring app structure.
- Minimum per feature:
  - 1 expected use
  - 1 edge case
  - 1 failure case