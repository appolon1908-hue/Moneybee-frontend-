<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getAuthContext,
  listPortalTasks,
  updatePortalTask,
  type PortalTask,
  type PortalTaskStatus,
} from "@moneybee/api-client";

const organizationId = ref("");
const tasks = ref<PortalTask[]>([]);
const filter = ref<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
const loading = ref(true);
const savingId = ref("");
const error = ref("");

const visibleTasks = computed(() => {
  if (filter.value === "ALL") return tasks.value;
  if (filter.value === "COMPLETED") {
    return tasks.value.filter((task) => task.status === "COMPLETED");
  }
  return tasks.value.filter(
    (task) => !["COMPLETED", "CANCELLED"].includes(task.status),
  );
});

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    tasks.value = await listPortalTasks(
      { assigned_to_me: true, limit: 250 },
      organizationId.value,
    );
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to load tasks.";
  } finally {
    loading.value = false;
  }
}

async function setStatus(task: PortalTask, status: PortalTaskStatus): Promise<void> {
  savingId.value = task.id;
  error.value = "";
  try {
    const updated = await updatePortalTask(
      task.id,
      { expected_version: task.version, status },
      organizationId.value,
    );
    tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "The task could not be updated.";
    await load();
  } finally {
    savingId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <main class="task-page">
    <header>
      <div>
        <p class="eyebrow">Action center</p>
        <h1>Keep your application moving.</h1>
        <p>Task changes use resource versions so two updates cannot silently overwrite each other.</p>
      </div>
      <button type="button" class="secondary" :disabled="loading" @click="load">Refresh</button>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>

    <nav class="filters" aria-label="Task filters">
      <button
        v-for="option in ['ACTIVE', 'COMPLETED', 'ALL'] as const"
        :key="option"
        type="button"
        :class="{ active: filter === option }"
        @click="filter = option"
      >
        {{ option }}
      </button>
    </nav>

    <p v-if="loading" class="notice">Loading tasks…</p>
    <section v-else class="tasks">
      <article v-for="task in visibleTasks" :key="task.id">
        <div class="task-copy">
          <div class="badges">
            <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
            <span>{{ task.status.replaceAll('_', ' ') }}</span>
          </div>
          <h2>{{ task.title }}</h2>
          <p>{{ task.description || task.task_type.replaceAll('_', ' ') }}</p>
          <small v-if="task.due_at">Due {{ new Date(task.due_at).toLocaleString() }}</small>
        </div>
        <div class="actions">
          <button
            v-if="task.status !== 'COMPLETED'"
            type="button"
            :disabled="savingId === task.id"
            @click="setStatus(task, 'COMPLETED')"
          >
            Mark complete
          </button>
          <button
            v-if="task.status === 'COMPLETED'"
            type="button"
            class="secondary"
            :disabled="savingId === task.id"
            @click="setStatus(task, 'OPEN')"
          >
            Reopen
          </button>
        </div>
      </article>
      <p v-if="!visibleTasks.length" class="empty">No tasks match this filter.</p>
    </section>
  </main>
</template>

<style scoped>
.task-page {
  display: grid;
  gap: 1.4rem;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3.5rem);
}
header,
.tasks article {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
h1,
h2,
p {
  margin-top: 0;
}
h1 {
  margin-bottom: 0.75rem;
  font-size: clamp(2.25rem, 6vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.055em;
}
h2 {
  margin: 0.65rem 0 0.4rem;
}
.eyebrow {
  margin-bottom: 0.4rem;
  color: #1647aa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.filters {
  display: flex;
  gap: 0.5rem;
}
button {
  min-height: 42px;
  border: 1px solid #1647aa;
  border-radius: 999px;
  padding: 0.65rem 0.95rem;
  color: white;
  background: #1647aa;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
button.secondary,
.filters button {
  color: #1647aa;
  background: white;
}
.filters button.active {
  color: white;
  background: #1647aa;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tasks {
  display: grid;
  gap: 0.9rem;
}
.tasks article {
  border: 1px solid #dce4f1;
  border-radius: 1.25rem;
  padding: 1.2rem;
  background: white;
  box-shadow: 0 12px 36px rgb(20 33 61 / 7%);
}
.task-copy {
  max-width: 720px;
}
.badges {
  display: flex;
  gap: 0.4rem;
}
.badges span {
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  color: #1647aa;
  background: #edf3ff;
  font-size: 0.72rem;
  font-weight: 800;
}
.badges .priority.urgent,
.badges .priority.high {
  color: #99251a;
  background: #fff0ed;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
small,
.empty {
  color: #64748b;
}
.notice {
  margin: 0;
  border-radius: 1rem;
  padding: 1rem;
  background: #edf3ff;
}
.notice.error {
  color: #8d2115;
  background: #fff0ed;
}
@media (max-width: 700px) {
  header,
  .tasks article {
    flex-direction: column;
  }
}
</style>
