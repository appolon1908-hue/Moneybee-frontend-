<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  createPortalConversation,
  createPortalMessage,
  getAuthContext,
  listPortalConversations,
  listPortalMessages,
  type PortalConversation,
  type PortalMessage,
} from "@moneybee/api-client";

const organizationId = ref("");
const conversations = ref<PortalConversation[]>([]);
const messages = ref<PortalMessage[]>([]);
const selectedConversationId = ref("");
const newTopic = ref("");
const newMessage = ref("");
const loading = ref(true);
const sending = ref(false);
const error = ref("");

async function loadConversations(): Promise<void> {
  conversations.value = await listPortalConversations(
    undefined,
    organizationId.value,
  );
  selectedConversationId.value =
    selectedConversationId.value || conversations.value[0]?.id || "";
  await loadMessages();
}

async function loadMessages(): Promise<void> {
  if (!selectedConversationId.value) {
    messages.value = [];
    return;
  }
  messages.value = await listPortalMessages(
    selectedConversationId.value,
    organizationId.value,
  );
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id ?? "";
    await loadConversations();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load messages.";
  } finally {
    loading.value = false;
  }
}

async function createConversation(): Promise<void> {
  if (!newTopic.value.trim()) return;
  sending.value = true;
  error.value = "";
  try {
    const conversation = await createPortalConversation(
      {
        topic: newTopic.value.trim(),
        opening_message: newMessage.value.trim() || "I need help with my MoneyBee account.",
        metadata_payload: { channel: "BORROWER_PORTAL" },
      },
      organizationId.value,
    );
    newTopic.value = "";
    newMessage.value = "";
    selectedConversationId.value = conversation.id;
    await loadConversations();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to start the conversation.";
  } finally {
    sending.value = false;
  }
}

async function sendMessage(): Promise<void> {
  if (!selectedConversationId.value || !newMessage.value.trim()) return;
  sending.value = true;
  error.value = "";
  try {
    await createPortalMessage(
      selectedConversationId.value,
      { body: newMessage.value.trim() },
      organizationId.value,
    );
    newMessage.value = "";
    await loadMessages();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to send your message.";
  } finally {
    sending.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="message-page">
    <header>
      <p class="eyebrow">Secure messages</p>
      <h1>Talk with the MoneyBee team.</h1>
      <p>Every conversation is tied to your authenticated organization context.</p>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading conversations…</p>

    <section v-else class="messenger">
      <aside>
        <div class="aside-heading">
          <h2>Conversations</h2>
          <button type="button" class="quiet" @click="loadConversations">Refresh</button>
        </div>
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          :class="['conversation', { active: conversation.id === selectedConversationId }]"
          @click="selectedConversationId = conversation.id; loadMessages()"
        >
          <strong>{{ conversation.topic }}</strong>
          <small>{{ conversation.status }} · {{ new Date(conversation.last_message_at).toLocaleString() }}</small>
        </button>
        <p v-if="!conversations.length" class="empty">No conversations yet.</p>
      </aside>

      <article class="thread">
        <div v-if="selectedConversationId" class="messages" aria-live="polite">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
          >
            <strong>{{ message.sender_subject }}</strong>
            <p>{{ message.body }}</p>
            <small>{{ new Date(message.created_at).toLocaleString() }}</small>
          </div>
          <p v-if="!messages.length" class="empty">This conversation has no messages.</p>
        </div>
        <div v-else class="new-conversation">
          <h2>Start a conversation</h2>
          <label>
            Subject
            <input v-model="newTopic" maxlength="240" placeholder="How can we help?" />
          </label>
        </div>

        <form @submit.prevent="selectedConversationId ? sendMessage() : createConversation()">
          <label>
            Message
            <textarea
              v-model="newMessage"
              rows="4"
              maxlength="20000"
              placeholder="Write a secure message…"
            />
          </label>
          <button type="submit" :disabled="sending || (!selectedConversationId && !newTopic.trim())">
            {{ sending ? "Sending…" : selectedConversationId ? "Send message" : "Start conversation" }}
          </button>
        </form>
      </article>
    </section>
  </main>
</template>

<style scoped>
.message-page {
  display: grid;
  gap: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3.5rem);
}
header {
  max-width: 760px;
}
h1,
h2,
p {
  margin-top: 0;
}
h1 {
  font-size: clamp(2.25rem, 6vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.055em;
}
.eyebrow {
  margin-bottom: 0.4rem;
  color: #1647aa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.messenger {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 2fr);
  min-height: 620px;
  overflow: hidden;
  border: 1px solid #dce4f1;
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 18px 50px rgb(20 33 61 / 9%);
}
aside {
  padding: 1rem;
  border-right: 1px solid #e6ebf3;
  background: #f7f9fc;
}
.aside-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.conversation {
  display: grid;
  width: 100%;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  padding: 0.85rem;
  text-align: left;
  background: transparent;
  cursor: pointer;
}
.conversation.active,
.conversation:hover {
  border-color: #bcd0fb;
  background: white;
}
.thread {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}
.messages,
.new-conversation {
  display: grid;
  align-content: start;
  gap: 0.75rem;
  overflow: auto;
  padding: 1.25rem;
}
.message {
  width: min(680px, 92%);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  background: #edf3ff;
}
.message p {
  margin: 0.4rem 0;
  white-space: pre-wrap;
}
form {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e6ebf3;
}
label {
  display: grid;
  gap: 0.45rem;
  font-weight: 750;
}
input,
textarea,
button {
  border: 1px solid #cad4e5;
  border-radius: 0.8rem;
  padding: 0.7rem 0.8rem;
  font: inherit;
}
textarea {
  resize: vertical;
}
form button {
  justify-self: end;
  min-height: 44px;
  border-color: #1647aa;
  color: white;
  background: #1647aa;
  font-weight: 800;
  cursor: pointer;
}
.quiet {
  border: 0;
  color: #1647aa;
  background: transparent;
  font-weight: 750;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
@media (max-width: 760px) {
  .messenger {
    grid-template-columns: 1fr;
  }
  aside {
    border-right: 0;
    border-bottom: 1px solid #e6ebf3;
  }
}
</style>
