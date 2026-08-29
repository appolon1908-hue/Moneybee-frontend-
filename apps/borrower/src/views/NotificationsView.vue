<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getAuthContext,
  listPortalNotifications,
  markPortalNotificationRead,
  type PortalNotification,
} from "@moneybee/api-client";

const organizationId = ref("");
const notifications = ref<PortalNotification[]>([]);
const unreadOnly = ref(false);
const loading = ref(true);
const savingId = ref("");
const error = ref("");

const unreadCount = computed(
  () => notifications.value.filter((notification) => !notification.read_at).length,
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id ?? "";
    notifications.value = await listPortalNotifications(
      unreadOnly.value,
      organizationId.value,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load notifications.";
  } finally {
    loading.value = false;
  }
}

async function markRead(notification: PortalNotification): Promise<void> {
  savingId.value = notification.id;
  error.value = "";
  try {
    const updated = await markPortalNotificationRead(
      notification.id,
      organizationId.value,
    );
    notifications.value = notifications.value.map((item) =>
      item.id === updated.id ? updated : item,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to update notification.";
  } finally {
    savingId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <main class="notification-page">
    <header>
      <div>
        <p class="eyebrow">Notification center</p>
        <h1>Every update in one place.</h1>
        <p>{{ unreadCount }} unread notification{{ unreadCount === 1 ? "" : "s" }} currently loaded.</p>
      </div>
      <label class="toggle">
        <input v-model="unreadOnly" type="checkbox" @change="load" />
        Unread only
      </label>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading notifications…</p>

    <section v-else class="notifications">
      <article
        v-for="notification in notifications"
        :key="notification.id"
        :class="{ unread: !notification.read_at }"
      >
        <div>
          <div class="meta">
            <span>{{ notification.notification_type.replaceAll("_", " ") }}</span>
            <small>{{ new Date(notification.created_at).toLocaleString() }}</small>
          </div>
          <h2>{{ notification.title }}</h2>
          <p>{{ notification.body }}</p>
          <a v-if="notification.href" :href="notification.href">Open related item →</a>
        </div>
        <button
          v-if="!notification.read_at"
          type="button"
          :disabled="savingId === notification.id"
          @click="markRead(notification)"
        >
          Mark read
        </button>
        <span v-else class="read-badge">Read</span>
      </article>
      <p v-if="!notifications.length" class="empty">No notifications match this view.</p>
    </section>
  </main>
</template>

<style scoped>
.notification-page {
  display: grid;
  gap: 1.4rem;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3.5rem);
}
header,
.notifications article,
.meta {
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
  margin: 0.6rem 0 0.35rem;
}
.eyebrow {
  margin-bottom: 0.4rem;
  color: #1647aa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #dce4f1;
  border-radius: 999px;
  padding: 0.7rem 0.9rem;
  white-space: nowrap;
  background: white;
  font-weight: 750;
}
.notifications {
  display: grid;
  gap: 0.85rem;
}
.notifications article {
  border: 1px solid #dce4f1;
  border-radius: 1.25rem;
  padding: 1.2rem;
  background: white;
  box-shadow: 0 12px 36px rgb(20 33 61 / 7%);
}
.notifications article.unread {
  border-color: #9ab8f5;
  box-shadow: inset 5px 0 #1647aa, 0 12px 36px rgb(20 33 61 / 8%);
}
.meta {
  justify-content: flex-start;
  color: #64748b;
}
.meta span {
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  color: #1647aa;
  background: #edf3ff;
  font-size: 0.72rem;
  font-weight: 800;
}
a {
  color: #1647aa;
  font-weight: 750;
  text-decoration: none;
}
button {
  min-height: 42px;
  border: 1px solid #1647aa;
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  color: white;
  background: #1647aa;
  font: inherit;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
}
.read-badge {
  color: #64748b;
  font-weight: 750;
}
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
@media (max-width: 680px) {
  header,
  .notifications article {
    flex-direction: column;
  }
}
</style>
