<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getAuthContext,
  getBorrowerApplicationWorkspace,
  getBorrowerWorkspace,
  uploadBorrowerDocument,
  type BorrowerApplicationWorkspace,
  type BorrowerWorkspace,
} from "@moneybee/api-client";

const workspace = ref<BorrowerWorkspace | null>(null);
const details = ref<BorrowerApplicationWorkspace | null>(null);
const organizationId = ref("");
const selectedApplicationId = ref("");
const documentType = ref("BANK_STATEMENT");
const selectedFile = ref<File | null>(null);
const loading = ref(true);
const uploading = ref(false);
const error = ref("");
const success = ref("");

const applications = computed(() => workspace.value?.applications ?? []);

async function loadApplication(): Promise<void> {
  if (!selectedApplicationId.value) {
    details.value = null;
    return;
  }
  details.value = await getBorrowerApplicationWorkspace(
    selectedApplicationId.value,
    organizationId.value,
  );
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    workspace.value = await getBorrowerWorkspace(organizationId.value);
    selectedApplicationId.value =
      selectedApplicationId.value || applications.value[0]?.id || "";
    await loadApplication();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load documents.";
  } finally {
    loading.value = false;
  }
}

function selectFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

async function upload(): Promise<void> {
  if (!selectedFile.value || !selectedApplicationId.value) return;
  uploading.value = true;
  error.value = "";
  success.value = "";
  try {
    await uploadBorrowerDocument({
      applicationId: selectedApplicationId.value,
      documentType: documentType.value,
      file: selectedFile.value,
      organizationId: organizationId.value,
    });
    success.value =
      "Upload received. The document is quarantined until security scanning completes.";
    selectedFile.value = null;
    await loadApplication();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "The secure upload failed.";
  } finally {
    uploading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="document-page">
    <header>
      <p class="eyebrow">Secure documents</p>
      <h1>Upload once. Track every step.</h1>
      <p>
        Files are uploaded directly to private quarantine storage. MoneyBee verifies
        file size, SHA-256 metadata, and session ownership before scanning begins.
      </p>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="success" class="notice success" role="status">{{ success }}</p>
    <p v-if="loading" class="notice">Loading document workspace…</p>

    <template v-else>
      <section class="upload-panel">
        <label>
          Application
          <select v-model="selectedApplicationId" @change="loadApplication">
            <option value="" disabled>Select an application</option>
            <option
              v-for="application in applications"
              :key="application.id"
              :value="application.id"
            >
              {{ application.status.replaceAll("_", " ") }} ·
              {{ application.requested_amount ?? "Amount pending" }}
            </option>
          </select>
        </label>
        <label>
          Document type
          <select v-model="documentType">
            <option value="BANK_STATEMENT">Bank statement</option>
            <option value="TAX_RETURN">Tax return</option>
            <option value="IDENTITY">Identity document</option>
            <option value="BUSINESS_LICENSE">Business license</option>
            <option value="VOIDED_CHECK">Voided check</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label class="file-label">
          File
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/tiff,text/csv,.xlsx,.docx"
            @change="selectFile"
          />
          <small>Maximum 25 MB. Executable files are not accepted.</small>
        </label>
        <button
          type="button"
          :disabled="uploading || !selectedFile || !selectedApplicationId"
          @click="upload"
        >
          {{ uploading ? "Securing upload…" : "Upload securely" }}
        </button>
      </section>

      <section class="panel">
        <div class="heading">
          <div>
            <p class="eyebrow">Application file</p>
            <h2>Documents and scan status</h2>
          </div>
          <button type="button" class="secondary" @click="loadApplication">
            Refresh
          </button>
        </div>
        <div v-if="details?.documents.length" class="document-list">
          <article v-for="document in details.documents" :key="String(document.id)">
            <div>
              <strong>{{ document.document_type ?? "Document" }}</strong>
              <small>{{ document.original_file_name ?? document.file_name }}</small>
            </div>
            <span>{{ document.scan_status ?? document.status ?? "PENDING" }}</span>
          </article>
        </div>
        <p v-else class="empty">No documents are associated with this application.</p>
      </section>

      <section class="panel">
        <p class="eyebrow">Upload sessions</p>
        <h2>Security pipeline</h2>
        <div v-if="details?.upload_sessions.length" class="document-list">
          <article v-for="session in details.upload_sessions" :key="session.id">
            <div>
              <strong>{{ session.original_file_name }}</strong>
              <small>{{ session.document_type.replaceAll("_", " ") }}</small>
            </div>
            <span>{{ session.status.replaceAll("_", " ") }}</span>
          </article>
        </div>
        <p v-else class="empty">No secure upload sessions have been issued.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.document-page {
  display: grid;
  gap: 1.5rem;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3.5rem);
}
header {
  max-width: 820px;
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
.eyebrow {
  margin-bottom: 0.45rem;
  color: #1647aa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.upload-panel,
.panel {
  border: 1px solid rgb(20 33 61 / 10%);
  border-radius: 1.5rem;
  padding: clamp(1rem, 3vw, 1.75rem);
  background: white;
  box-shadow: 0 16px 44px rgb(20 33 61 / 8%);
}
.upload-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 1rem;
}
label {
  display: grid;
  gap: 0.5rem;
  font-weight: 750;
}
input,
select,
button {
  min-height: 46px;
  border: 1px solid #cad4e5;
  border-radius: 0.8rem;
  padding: 0.7rem 0.8rem;
  font: inherit;
  background: white;
}
button {
  border-color: #1647aa;
  color: white;
  background: #1647aa;
  font-weight: 800;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
button.secondary {
  color: #1647aa;
  background: white;
}
.file-label small,
.empty,
.document-list small {
  color: #64748b;
}
.heading,
.document-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.document-list {
  display: grid;
}
.document-list article {
  padding: 1rem 0;
  border-top: 1px solid #e8edf5;
}
.document-list article:first-child {
  border-top: 0;
}
.document-list div {
  display: grid;
  gap: 0.25rem;
}
.document-list span {
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: #1647aa;
  background: #edf3ff;
  font-size: 0.75rem;
  font-weight: 800;
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
.notice.success {
  color: #146c43;
  background: #e9f8f0;
}
@media (max-width: 900px) {
  .upload-panel {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 620px) {
  .upload-panel {
    grid-template-columns: 1fr;
  }
  .heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
