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

### Quick flows

- **Current work?** → `list_running_processes` → `list_tasks` → `get_task` as needed.
- **Standalone heavy work (no process task)?** → `start_agent_job` → tell human results will land in chat → optional `get_agent_job_status`.
- **Run a board task?** → `execute_task` with `context`; job agent `move_task` to Done when finished.
- When a task is failed, move it back to Todo.
- When a task is completed, move it to Done.
- Get more project context: use `browse_contexts` before asking human.