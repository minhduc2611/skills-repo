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
| `put_process_context` | Store shared context on a running process. |
| `get_process_memory` | Read contexts + prior results for a running process. |
| `browse_contexts` | Browse stored Context notes (optional `runningProcessId`). |
| `create_data_source` | Create a data-source container. |
| `define_entity_type` | New entity type under a data source. |
| `get_entity_type` | Fetch entity type + schema. |
| `update_entity_type` | Update name/description/schema. |
| `upsert_entity_record` | Create/update a record (`externalId` for idempotency). |
| `list_entity_types` | List types under a data source. |
| `list_entity_records` | List records for an entity type. |
| `attach_entity_ref` | Link a record to a kanban task. |
| `move_task` | Move task to a column (`Todo` / `In Progress` / `Done` or status id). Done advances process tasks. |
| `create_script` | Create an org script (`name`, `source` with `main(input)`). Optional: `description`, `language`, `secretIds`, `inputs`, `outputs`. Returns id + meta (no source). |
| `update_script` | Update a script by `scriptId` (source/name/I/O/secrets). Returns id + meta (no source). |
| `list_scripts` | List org scripts (id, name, description, language, inputs, outputs, secretIds). No source. |
| `get_script` | Get one script by `scriptId` including source. |
| `run_script` | Sync-run a script by `scriptId` (optional `payload`, `secretIds`). Returns `runId`, `status`, `output`, `error`. |

### Quick flows

- **Current work?** → `list_running_processes` → `list_tasks` → `get_task` as needed.
- **Standalone heavy work (no process task)?** → `start_agent_job` → tell human results will land in chat → optional `get_agent_job_status`.
- **Run a board task?** → `execute_task` with `context`; job agent `move_task` to Done when finished.
- **Script?** → `list_scripts` / `get_script` → `create_script` / `update_script` → `list_secrets` for ids → `run_script`.
- When a task is failed, move it back to Todo.
- When a task is completed, move it to Done.
- Get more project context: use `browse_contexts` before asking human.


### Writting Scripts

Scripts are for reliable deterministic code execution, data routing, data transformation, integration, ... that can be reused and enhanced many times

#### Contract
- Language: `typescript` (default) or `python`.
- Entrypoint: `main(input)` that **returns** a JSON-serializable value. Do **not** `console.log` / `print` the result — the runtime captures the return value as `output`.
- Declare `inputs` / `outputs` on create/update (`name`, `type`: `string` | `number` | `boolean` | `json`, `required`). Payload to `run_script` must match `inputs`.
- Secrets: `list_secrets` → pass UUIDs as `secretIds` on create or on `run_script`. Values appear as env vars by **key** (e.g. `Deno.env.get("APIFY_API_KEY")` / `os.environ["APIFY_API_KEY"]`).

#### How scripts works 
- scripts are wrapped in a function called `main` that takes an input and returns an output
```typescript
/*
Example script that scrapes a LinkedIn profile and returns the profile data
*/
async function main(input: ScriptInput) {
  const userUrl = input.userUrl;
  const apifyApiKey = Deno.env.get("APIFY_API_KEY");
  if (!apifyApiKey) {
    throw new Error("APIFY_API_KEY is not set.");
  }

  // logics
  
  const items = await response.json();  

  return { ok: true, received: items }
}
```

#### How to write scripts
- explicit check nulls of required inputs
- check lastest documentation of the tool you are using
- we are using Deno runtime, so you can use Deno specific features, add Deno dependencies to the script, and so on.