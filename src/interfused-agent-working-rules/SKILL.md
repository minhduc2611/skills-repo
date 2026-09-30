---
name: interfused-agent-working-rules
description: >-
  Working rules for Interfused conversation agents: allowed tools and
  condition→guide pairs from the guidelines DB. Use when acting as an
  Interfused org agent, routing goals to processes/tasks/jobs, or when the
  user mentions agent working rules, guidelines, or tool usage.
---

# Interfused agent working rules

Follow these rules on every turn. Prefer tools over guessing.
The whole idea is to keep Kanban tasks in sync with the running processes, making it easier for human collaboration.
A running agent job should be always associated with a Kanban process-owned task.

## Four data / context layers

Use the right layer. Do not dump structured CRM rows into Context notes, and do not invent brand/repo facts when memory already has them.

| Layer | What it is | Lifetime | Tools |
|---|---|---|---|
| **1. Org data records** | Schema’d long-term rows (leads, schedule posts, …) via DataSource → EntityType → EntityRecord | Months–years | `create_data_source`, `define_entity_type`, `get_entity_type`, `update_entity_type`, `upsert_entity_record`, `list_entity_types`, `list_entity_records`, `attach_entity_ref` |
| **2. Org context** | SSOT prose: brand, goals, vision, voice | Org life | `put_context` (`scope=organization`), `browse_contexts` (`scope=organization`), `update_context`, `delete_context` |
| **3. Project context** | Project facts: git repos, materials, paths, constraints | Project life | `put_context` (`scope=project` + `projectId`), `browse_contexts` (`scope=project` / `projectId`), `update_context`, `delete_context` |
| **4. Process context** | Shared notes for one running process (HITL answers, run goals) | One run | `put_context` / `put_process_context`, `get_process_memory`, `browse_contexts` (`scope=process` / `runningProcessId`), `update_context`, `delete_context` |

**Lookup order before asking a human:** org context → project context (if `projectId`) → process memory → then `ask_human`.

**Write rules:**

- Tabular / many-row data → layer 1 (entity records).
- Stable brand/goals → layer 2.
- Repos / materials for a project → layer 3.
- Answers and facts needed only for this run → layer 4.
- Context notes are append-oriented free text (edit/delete by `contextId` when correcting).

## Tools you can use

Conversation agents may call only these tools:

| Tool | Use for |
|------|---------|
| `start_agent_job` | Delegate heavy/long work to a sub-agent job. Returns `runId`. **Not** for process-owned tasks. Optional: `skills`, `inputArtifactKeys`, `taskId`, `secretIds`. |
| `list_secrets` | List org secret ids/keys (no values) for `start_agent_job.secretIds`. |
| `get_agent_job_status` | Poll a job by `runId`. |
| `search_agent_jobs` | Recent org jobs; optional `taskId` filter. |
| `list_running_processes` | Live process instances (id, name, type, status, autorun). |
| `list_task_statuses` | Kanban columns. |
| `list_tasks` | Top-level tasks; filter by `runningProcessId` / `statusId`. |
| `get_task` | One task + subtasks. |
| `get_process_by_id` | Saved process definition + diagram. |
| `search_processes` | Semantic search over process templates. |
| `start_process` | Start a saved process (`processId`, optional `autorun`, `projectId`). |
| `execute_task` | Move task In Progress + start its job; pass `context` summarizing human answers/goals. |
| `put_context` | Append Context note (`scope`: `organization` \| `project` \| `process`; require `projectId` / `runningProcessId` as needed). |
| `put_process_context` | Alias for `put_context` with `scope=process`. |
| `get_process_memory` | Read org + project + process contexts and prior results for a running process. |
| `browse_contexts` | Browse Context notes; filter by `scope` / `projectId` / `runningProcessId`. |
| `update_context` | Update a Context note by `contextId`. |
| `delete_context` | Delete a Context note by `contextId`. |
| `create_data_source` | Create a data-source container. |
| `define_entity_type` | New entity type under a data source. |
| `get_entity_type` | Fetch entity type + schema. |
| `update_entity_type` | Update name/description/schema. |
| `upsert_entity_record` | Create/update a record (`externalId` for idempotency). |
| `list_entity_types` | List types under a data source. |
| `list_entity_records` | List records for an entity type. |
| `attach_entity_ref` | Link a record to a kanban task. |
| `move_task` | Move task to a column (`Todo` / `In Progress` / `Done` or status id). Done advances process tasks. |
| `create_script` | Create org script. Prefer `sourcePath` under `/tmp/work` (write file first) over inline `source` — large tool JSON truncates. Optional: `description`, `language`, `secretIds`, `inputs`, `outputs`. |
| `update_script` | Update by `scriptId`. Prefer `sourcePath` for large source. |
| `list_scripts` | List org scripts (id, name, description, language, inputs, outputs, secretIds). No source. |
| `get_script` | Get one script by `scriptId` including source. |
| `run_script` | Sync-run a script by `scriptId` (optional `payload`, `secretIds`). Returns `runId`, `status`, `output`, `error`. |
| `list_cms_pages` | List CMS pages (id, slug, title, published, moduleCount). |
| `get_cms_page` | Get one page + modules (`scriptId`, props). |
| `create_cms_page` | Create empty page (`title`, `slug`). Always follow with `upsert_cms_modules`. |
| `update_cms_page` | Update page meta only (title/slug/published). |
| `upsert_cms_modules` | Set page modules. **data-panel MUST include `scriptId`** (never leave Script as none). |
| `preview_cms_page` | Run bound data-panel scripts; returns `liveData` / `liveError`. |

### Quick flows

- **Current work?** → `list_running_processes` → `list_tasks` → `get_task` as needed.
- **Standalone heavy work (no process task)?** → `start_agent_job` → tell human results will land in chat → optional `get_agent_job_status`.
- **Run a board task?** → `execute_task` with `context`; job agent follows **Execute-task procedure** below.
- **Need remembered facts?** → `browse_contexts` / `get_process_memory` before asking the human.
- **Script?** → write source under `/tmp/work` → `create_script` / `update_script` with `sourcePath` → `list_secrets` → `run_script`.
- **Stats / dashboard / “how many …” page?** → follow **CMS data pages** below (script first, then bind `scriptId` on data-panel).
- When a task is failed, move it back to Todo.
- When a task is completed, move it to Done.

## CMS data pages (mandatory script)

When the user wants a page, dashboard, or statistics for org data (leads counts, “how many found”, tables of records):

1. **Script first** — `list_scripts`. Reuse or `create_script` / `update_script` a script that returns the data (usually `main(input, db)` aggregating entity records). Never ship a stats page without a working script.
2. **Schema if needed** — `list_entity_types` / `list_entity_records` when type names or fields are unknown.
3. **Page** — `list_cms_pages` then `create_cms_page` or reuse.
4. **Bind script** — `upsert_cms_modules` with at least one `data-panel` module:
   - `scriptId` = the script id from step 1 (**required** — do not omit; do not leave “— none —”)
   - `props`: `{ heading, display: "stats"|"table"|"list", columns: string[] }`
   - optional `scriptInput` if the script needs payload
5. **Verify** — `preview_cms_page`; if `liveError` or missing `liveData`, fix the script and re-upsert.
6. Reply with `/admin/cms/:pageId`.

**Hard rule:** A `data-panel` without `scriptId` is incomplete. Do not tell the user the page is done until the Script field is set and preview succeeds (or you clearly report the script error).

Do not scrape anew for “how many found” — count stored records unless the user asked to harvest.

## Execute-task procedure

When you are a delegated job running a kanban task (prompt says execute-task), follow this exactly:

1. **Orient** — load context before doing work:
   - Call `get_task` for this Task ID.
   - Call `get_process_memory` for this Running process ID (if present). It returns **organizationContexts**, **projectContexts**, **processContexts**, and **results**. Treat Shared memory in the prompt as known. Do not re-ask answered questions.
   - If you truly need human input for something not already in memory, call `ask_human` with `conversationId` from the Task section (if present), then STOP with a short summary that you are waiting.
2. **Work** — complete the task using the assigned agent system prompt and MCP tools as needed.
   - First ensure this task is In Progress (`move_task` if needed).
   - Persist durable facts with the correct layer (`put_context` or entity records).
3. **Close out** — when the work is actually finished:
   - Update the task if needed (`update_task`).
   - Move the task to Done (`move_task`). If there are failure, move it back to Todo.
   - End with a short summary of what you did.
   - Do NOT mark Done if you are waiting on `ask_human`.


### Writting Scripts

Scripts are for reliable deterministic code execution, data routing, data transformation, integration, ... that can be reused and enhanced many times

#### Contract
- Language: `typescript` (default) or `python`.
- Entrypoint: `async function main(input: ScriptInput, db: ScriptDb)` that **returns** a JSON-serializable value. Do **not** `console.log` / `print` the result — the runtime captures the return value as `output`.
- Always take `db` as the second arg when reading/writing org entity data.
- Declare `inputs` / `outputs` on create/update (`name`, `type`: `string` | `number` | `boolean` | `json`, `required`). Payload to `run_script` must match `inputs`.
- Secrets: `list_secrets` → pass UUIDs as `secretIds` on create or on `run_script`. Values appear as env vars by **key** (e.g. `Deno.env.get("APIFY_API_KEY")` / `os.environ["APIFY_API_KEY"]`).

#### Using `db` (org entity catalogs)

`db.entity(entityTypeName)` talks to stored Data → EntityType → EntityRecord rows. Prefer this over hardcoding arrays from chat history.

| Method | Use |
|--------|-----|
| `list({ limit?, offset? })` | Page records (for stats / tables) |
| `get(id)` | One record by id |
| `add(payload)` | Insert |
| `update(id, patch)` | Patch fields |
| `upsert(object)` | Idempotent write (include identity fields the type expects) |
| `remove(id)` | Delete |

`entityTypeName` is the **entity type name** (e.g. `"ClientLead"`), not the data-source name. Discover names with `list_entity_types` before writing the script.

```typescript
// Stats / CMS data-panel: load from DB, never invent rows from conversation memory
async function main(_input: ScriptInput, db: ScriptDb) {
  const page = await db.entity("ClientLead").list({ limit: 100, offset: 0 }) as {
    data?: Array<{ id: string; payload?: Record<string, unknown> }>;
    pagination?: { total?: number };
  };
  const rows = page.data ?? [];
  return {
    total: page.pagination?.total ?? rows.length,
    rows: rows.map((r) => ({ id: r.id, ...(r.payload ?? {}) })),
  };
}
```

**Hard rule for dashboards:** do not hardcode leads/companies from chat. If `list` is empty, return `{ total: 0, rows: [] }` — do not fabricate sample data.

#### How scripts works
- scripts are wrapped in a function called `main` that takes an input and returns an output
```typescript
/*
Example: scrape LinkedIn then optionally persist via db
*/
async function main(input: ScriptInput, db: ScriptDb) {
  const userUrl = input.userUrl;
  const apifyApiKey = Deno.env.get("APIFY_API_KEY");
  if (!apifyApiKey) {
    throw new Error("APIFY_API_KEY is not set.");
  }

  // logics...
  const items = await response.json();
  // optional: await db.entity("ClientLead").upsert({ ... })

  return { ok: true, received: items }
}
```

#### How to write scripts
- explicit check nulls of required inputs
- check latest documentation of the tool you are using
- we are using Deno runtime, so you can use Deno specific features, add Deno dependencies to the script, and so on.
- for org data / CMS panels: use `db.entity(...).list` (etc.); never hardcode business rows from conversation history
