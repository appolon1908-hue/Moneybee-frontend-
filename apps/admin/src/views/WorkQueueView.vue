<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  createAdminTask,
  getAuthContext,
  listAdminTasks,
  updateAdminTask,
  type PortalTask,
  type PortalTaskPriority,
  type PortalTaskStatus,
} from "@moneybee/api-client";

const organizationId = ref("");
const tasks = ref<PortalTask[]>([]);
const statusFilter = ref("");
const loading = ref(true);
const savingId = ref("");
const error = ref("");
const form = reactive({ tenantId: "", applicationId: "", title: "", description: "", priority: "NORMAL" as PortalTaskPriority, assignee: "", dueAt: "" });

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    form.tenantId = form.tenantId || context.active_organization_id;
    tasks.value = await listAdminTasks(
      { status: statusFilter.value || undefined, limit: 250 },
      organizationId.value,
    );
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to load work queue.";
  } finally {
    loading.value = false;
  }
}

async function createTask(): Promise<void> {
  savingId.value = "new";
  error.value = "";
  try {
    await createAdminTask(
      {
        tenant_id: form.tenantId,
        application_id: form.applicationId || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        assigned_to_subject: form.assignee.trim() || null,
        due_at: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      },
      organizationId.value,
    );
    form.applicationId = "";
    form.title = "";
    form.description = "";
    form.assignee = "";
    form.dueAt = "";
    await load();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to create task.";
  } finally {
    savingId.value = "";
  }
}

async function updateTask(
  task: PortalTask,
  changes: { status?: PortalTaskStatus; assigned_to_subject?: string | null },
): Promise<void> {
  savingId.value = task.id;
  error.value = "";
  try {
    const updated = await updateAdminTask(
      task.id,
      { expected_version: task.version, ...changes },
      organizationId.value,
    );
    tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "The task changed and was reloaded.";
    await load();
  } finally {
    savingId.value = "";
  }
}

function assignmentChanged(task: PortalTask, event: Event): void {
  const input = event.target as HTMLInputElement;
  void updateTask(task, { assigned_to_subject: input.value.trim() || null });
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header><div><p class="eyebrow">Operations work queue</p><h1>Assign, prioritize, and move work safely.</h1><p>Every mutation carries the current task version. Invalid state transitions and stale updates are rejected by the API.</p></div><label>Status<select v-model="statusFilter" @change="load"><option value="">All</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option></select></label></header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>

    <form class="create" @submit.prevent="createTask">
      <label>Tenant ID<input v-model="form.tenantId" required /></label>
      <label>Application ID<input v-model="form.applicationId" /></label>
      <label>Task title<input v-model="form.title" required maxlength="240" /></label>
      <label>Priority<select v-model="form.priority"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
      <label>Assignee subject<input v-model="form.assignee" /></label>
      <label>Due at<input v-model="form.dueAt" type="datetime-local" /></label>
      <label class="description">Description<textarea v-model="form.description" rows="3" maxlength="10000" /></label>
      <button type="submit" :disabled="savingId === 'new'">{{ savingId === "new" ? "Creating…" : "Create task" }}</button>
    </form>

    <p v-if="loading" class="notice">Loading work queue…</p>
    <section v-else class="queue">
      <article v-for="task in tasks" :key="task.id">
        <div class="copy"><div class="badges"><span :class="task.priority.toLowerCase()">{{ task.priority }}</span><span>{{ task.status.replaceAll('_', ' ') }}</span><span>v{{ task.version }}</span></div><h2>{{ task.title }}</h2><p>{{ task.description || task.task_type.replaceAll('_', ' ') }}</p><small>Tenant {{ task.tenant_id }}<template v-if="task.application_id"> · Application {{ task.application_id }}</template></small></div>
        <div class="controls">
          <label>Assignee<input :value="task.assigned_to_subject || ''" :disabled="savingId === task.id" @change="assignmentChanged(task, $event)" /></label>
          <label>Status<select :value="task.status" :disabled="savingId === task.id" @change="updateTask(task, { status: ($event.target as HTMLSelectElement).value as PortalTaskStatus })"><option>OPEN</option><option>IN_PROGRESS</option><option>BLOCKED</option><option>COMPLETED</option><option>CANCELLED</option></select></label>
        </div>
      </article>
      <p v-if="!tasks.length" class="empty">No tasks match this queue.</p>
    </section>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1440px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header,.queue article { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
header > div { max-width:900px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#5b2fc4; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.create,.queue article { border:1px solid #e0dcef; border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(23 19 63 / 7%); }
.create { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.85rem; align-items:end; }
.create .description { grid-column:span 2; }
label { display:grid; gap:.4rem; font-weight:750; }
input,select,textarea,button { border:1px solid #d1cbe4; border-radius:.75rem; padding:.65rem .75rem; font:inherit; }
button { min-height:44px; border-color:#5b2fc4; color:white; background:#5b2fc4; font-weight:850; cursor:pointer; }
.queue { display:grid; gap:.85rem; }
.copy { max-width:850px; }
.badges { display:flex; flex-wrap:wrap; gap:.35rem; }
.badges span { border-radius:999px; padding:.25rem .55rem; color:#5b2fc4; background:#f0ebff; font-size:.72rem; font-weight:850; }
.badges span.urgent,.badges span.high { color:#9b1d67; background:#ffeaf6; }
.controls { display:grid; min-width:260px; gap:.7rem; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#f0ebff; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:950px) { .create { grid-template-columns:repeat(2,minmax(0,1fr)); } .queue article { flex-direction:column; } .controls { width:100%; } }
@media (max-width:620px) { header { flex-direction:column; } .create { grid-template-columns:1fr; } .create .description { grid-column:auto; } }
</style>
