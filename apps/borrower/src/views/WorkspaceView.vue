<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  getAuthContext,
  getBorrowerWorkspace,
  type BorrowerWorkspace,
} from "@moneybee/api-client";

const workspace = ref<BorrowerWorkspace | null>(null);
const loading = ref(true);
const error = ref("");

const activeApplications = computed(
  () =>
    workspace.value?.applications.filter(
      (application) =>
        !["FUNDED", "DECLINED", "WITHDRAWN", "EXPIRED"].includes(
          application.status,
        ),
    ) ?? [],
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    workspace.value = await getBorrowerWorkspace(
      context.active_organization_id ?? undefined,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load your workspace.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="portal-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Borrower portal</p>
        <h1>Your financing workspace</h1>
        <p>
          Track applications, conditions, documents, tasks, and lender updates in
          one secure place.
        </p>
      </div>
      <button type="button" class="secondary" :disabled="loading" @click="load">
        Refresh
      </button>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading your MoneyBee workspace…</p>

    <template v-else-if="workspace">
      <section class="metrics" aria-label="Workspace summary">
        <article>
          <span>Applications</span>
          <strong>{{ workspace.summary.application_count }}</strong>
        </article>
        <article>
          <span>Active applications</span>
          <strong>{{ workspace.summary.active_application_count }}</strong>
        </article>
        <article>
          <span>Open tasks</span>
          <strong>{{ workspace.open_tasks.length }}</strong>
        </article>
        <article>
          <span>Unread updates</span>
          <strong>{{ workspace.unread_notifications.length }}</strong>
        </article>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Applications</p>
            <h2>Current financing requests</h2>
          </div>
          <RouterLink class="text-link" to="/applications">View all</RouterLink>
        </div>
        <div v-if="activeApplications.length" class="cards">
          <RouterLink
            v-for="application in activeApplications"
            :key="application.id"
            class="application-card"
            :to="`/applications/${application.id}`"
          >
            <span class="status">{{ application.status.replaceAll("_", " ") }}</span>
            <strong>{{ application.requested_amount ?? "Amount pending" }}</strong>
            <small>{{ application.use_of_funds ?? "Purpose not provided" }}</small>
            <span>Open workspace →</span>
          </RouterLink>
        </div>
        <p v-else class="empty">No active application is currently associated with this account.</p>
      </section>

      <section class="columns">
        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Action center</p>
              <h2>Tasks requiring attention</h2>
            </div>
            <RouterLink class="text-link" to="/tasks">All tasks</RouterLink>
          </div>
          <ul v-if="workspace.open_tasks.length" class="list">
            <li v-for="task in workspace.open_tasks.slice(0, 6)" :key="task.id">
              <div>
                <strong>{{ task.title }}</strong>
                <small>{{ task.description || task.task_type.replaceAll("_", " ") }}</small>
              </div>
              <span :class="['priority', task.priority.toLowerCase()]">{{ task.priority }}</span>
            </li>
          </ul>
          <p v-else class="empty">You have no open tasks.</p>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Updates</p>
              <h2>Recent notifications</h2>
            </div>
            <RouterLink class="text-link" to="/notifications">All updates</RouterLink>
          </div>
          <ul v-if="workspace.unread_notifications.length" class="list">
            <li
              v-for="notification in workspace.unread_notifications.slice(0, 6)"
              :key="notification.id"
            >
              <div>
                <strong>{{ notification.title }}</strong>
                <small>{{ notification.body }}</small>
              </div>
            </li>
          </ul>
          <p v-else class="empty">You are all caught up.</p>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.portal-page {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.25rem, 4vw, 3.5rem);
  max-width: 1440px;
  margin: 0 auto;
}
.hero,
.panel-heading,
.list li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.hero {
  padding: clamp(1.5rem, 4vw, 3rem);
  border-radius: 2rem;
  color: white;
  background: linear-gradient(135deg, #14213d, #2056d8 70%, #53c5ff);
  box-shadow: 0 24px 60px rgb(20 33 61 / 18%);
}
h1,
h2,
p {
  margin-top: 0;
}
h1 {
  max-width: 720px;
  margin-bottom: 0.75rem;
  font-size: clamp(2rem, 5vw, 4.75rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}
h2 {
  margin-bottom: 0;
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  letter-spacing: -0.025em;
}
.eyebrow {
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.metrics,
.cards,
.columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.metrics article,
.panel,
.application-card {
  border: 1px solid rgb(20 33 61 / 9%);
  border-radius: 1.35rem;
  background: white;
  box-shadow: 0 12px 36px rgb(20 33 61 / 7%);
}
.metrics article {
  display: grid;
  gap: 0.4rem;
  padding: 1.25rem;
}
.metrics strong {
  font-size: 2rem;
}
.panel {
  padding: 1.25rem;
}
.panel-heading {
  margin-bottom: 1rem;
}
.application-card {
  display: grid;
  gap: 0.65rem;
  min-height: 180px;
  padding: 1.25rem;
  color: inherit;
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.application-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 44px rgb(20 33 61 / 12%);
}
.application-card > strong {
  font-size: 1.5rem;
}
.status,
.priority {
  width: fit-content;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  background: #edf3ff;
  color: #1647aa;
  font-size: 0.72rem;
  font-weight: 800;
}
.priority.urgent,
.priority.high {
  background: #fff0ed;
  color: #a52a19;
}
.columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.list li {
  padding: 0.9rem 0;
  border-top: 1px solid #e8edf5;
}
.list li:first-child {
  border-top: 0;
}
.list div {
  display: grid;
  gap: 0.25rem;
}
.list small,
.application-card small,
.empty {
  color: #61708a;
}
.text-link {
  color: #1647aa;
  font-weight: 750;
  text-decoration: none;
}
button,
.secondary {
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}
.secondary {
  color: #14213d;
  background: white;
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
@media (max-width: 960px) {
  .metrics,
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .hero,
  .panel-heading {
    flex-direction: column;
  }
  .metrics,
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
