<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { usePortal } from "~/composables/usePortal";

const emit = defineEmits<{
  login: [];
  switchToStudent: [];
}>();

const { adminLogin } = usePortal();
const api = useApi();

const email = ref("");
const password = ref("");
const remember = ref(false);
const loading = ref(false);
const errorMsg = ref("");
const resetMode = ref(false);
const resetStep = ref<"request" | "confirm">("request");
const resetEmail = ref("");
const resetCode = ref("");
const resetPassword = ref("");
const resetPasswordConfirm = ref("");
const resetLoading = ref(false);
const resetError = ref("");
const resetNotice = ref("");

onMounted(() => {
  const savedEmail = localStorage.getItem("remembered-admin-email");
  if (savedEmail) {
    email.value = savedEmail;
    remember.value = true;
  }
});

const handleSubmit = async () => {
  errorMsg.value = "";
  if (!remember.value) localStorage.removeItem("remembered-admin-email");
  loading.value = true;
  try {
    const result = await adminLogin(
      email.value,
      password.value,
      remember.value,
    );
    if (!result.success) {
      errorMsg.value = result.error || "Login failed.";
      return;
    }
    if (remember.value)
      localStorage.setItem("remembered-admin-email", email.value.trim());
    emit("login");
  } catch (e: any) {
    errorMsg.value = e.message || "An unexpected error occurred.";
  } finally {
    loading.value = false;
  }
};

const submitPasswordReset = async () => {
  resetError.value = "";
  resetNotice.value = "";
  if (resetStep.value === "request") {
    resetLoading.value = true;
    try {
      await api.requestPasswordReset(resetEmail.value.trim());
      resetStep.value = "confirm";
      resetNotice.value =
        "If an account uses this email, a reset request was accepted. Check your inbox for a code.";
    } catch (e: any) {
      resetError.value = e.message || "Unable to request a reset code.";
    } finally {
      resetLoading.value = false;
    }
    return;
  }
  if (resetPassword.value !== resetPasswordConfirm.value) {
    resetError.value = "The passwords do not match.";
    return;
  }
  resetLoading.value = true;
  try {
    await api.confirmPasswordReset(
      resetEmail.value.trim(),
      resetCode.value,
      resetPassword.value,
    );
    resetMode.value = false;
    resetStep.value = "request";
    resetCode.value = "";
    resetPassword.value = "";
    resetPasswordConfirm.value = "";
    resetNotice.value = "Password updated. Sign in with your new password.";
  } catch (e: any) {
    resetError.value = e.message || "Unable to reset the password.";
  } finally {
    resetLoading.value = false;
  }
};
</script>

<template>
  <div class="relative grid min-h-screen place-items-center bg-navy p-3 sm:p-8">
    <div
      class="fixed inset-0 opacity-15 pointer-events-none"
      style="
        background-image: radial-gradient(#1680a3 1px, transparent 1px);
        background-size: 34px 34px;
      "
    ></div>

    <div
      class="relative z-10 flex w-full max-w-[1028px] overflow-hidden rounded-lg shadow-2xl"
    >
      <!-- Visual panel -->
      <div
        class="hidden w-[430px] min-h-[645px] p-14 flex-col justify-between text-white lg:flex"
        style="background: linear-gradient(150deg, #0b355a, #02172c 72%)"
      >
        <div class="relative z-10">
          <div class="flex items-center gap-3">
            <span class="text-3xl text-cyan">♢</span>
            <strong class="text-2xl">SecureCheck AI</strong>
          </div>
          <small class="block mt-1 font-mono text-xs tracking-widest text-cyan"
            >STAFF PORTAL</small
          >
        </div>
        <p class="relative z-10 text-gray-200 leading-relaxed max-w-[310px]">
          Authorized personnel only. All access attempts are logged and
          monitored by the Aegis security framework.
        </p>
        <button
          class="relative z-10 self-start text-white border border-navy-300 rounded px-4 py-3 font-mono text-xs hover:bg-navy-700 transition-colors"
          type="button"
          @click="$emit('switchToStudent')"
        >
          ♧ Login as Student
        </button>
      </div>

      <!-- Form panel -->
      <form
        class="w-full bg-surface p-5 pt-7 sm:p-10 lg:min-h-[645px] lg:w-[598px] lg:p-16 lg:pt-14"
        @submit.prevent="resetMode ? submitPasswordReset() : handleSubmit()"
      >
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl text-cyan">♢</span>
          <strong class="text-2xl">SecureCheck AI</strong>
        </div>

        <div class="mb-7 mt-8 sm:mb-8 sm:mt-12">
          <h1 class="text-3xl tracking-tight sm:text-4xl">
            {{ resetMode ? "Reset password" : "Sign In" }}
          </h1>
          <p class="mt-2 text-sm text-gray-600 sm:text-base">
            {{
              resetMode
                ? resetStep === "request"
                  ? "Enter the email address linked to your staff account."
                  : "Enter the six-digit code and choose a new password. Codes expire after 10 minutes."
                : "Enter your staff credentials to continue."
            }}
          </p>
        </div>

        <p
          v-if="resetNotice"
          class="mb-4 text-sm text-emerald-700"
          role="status"
        >
          {{ resetNotice }}
        </p>

        <template v-if="resetMode">
          <label class="block text-ink font-mono text-[11px] tracking-wide">
            ACCOUNT EMAIL
            <input
              v-model="resetEmail"
              type="email"
              required
              autocomplete="email"
              :readonly="resetStep === 'confirm'"
              class="input-field mt-2 read-only:bg-gray-100"
              placeholder="you@institution.edu"
            />
          </label>
          <label
            v-if="resetStep === 'confirm'"
            class="mt-5 block text-ink font-mono text-[11px] tracking-wide"
          >
            SIX-DIGIT CODE
            <input
              v-model="resetCode"
              type="text"
              required
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              maxlength="6"
              class="input-field mt-2 tracking-[0.3em]"
              placeholder="000000"
            />
          </label>
          <label
            v-if="resetStep === 'confirm'"
            class="mt-5 block text-ink font-mono text-[11px] tracking-wide"
          >
            NEW PASSWORD
            <PasswordInput
              v-model="resetPassword"
              class="mt-2"
              autocomplete="new-password"
              :required="true"
            />
          </label>
          <label
            v-if="resetStep === 'confirm'"
            class="mt-5 block text-ink font-mono text-[11px] tracking-wide"
          >
            CONFIRM NEW PASSWORD
            <PasswordInput
              v-model="resetPasswordConfirm"
              class="mt-2"
              autocomplete="new-password"
              :required="true"
            />
          </label>
          <p v-if="resetError" class="mt-4 text-sm text-danger" role="alert">
            {{ resetError }}
          </p>
          <button
            type="submit"
            :disabled="resetLoading"
            class="mt-7 w-full rounded-md bg-navy py-3.5 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-navy-light disabled:opacity-50"
          >
            {{
              resetLoading
                ? "Please wait..."
                : resetStep === "request"
                  ? "Send reset code"
                  : "Update password"
            }}
          </button>
          <button
            type="button"
            class="mt-4 w-full py-2 text-sm text-gray-600 hover:text-navy"
            @click="
              resetMode = false;
              resetError = '';
              resetNotice = '';
            "
          >
            Back to sign in
          </button>
        </template>

        <template v-else>
          <label
            class="block text-ink font-mono text-[11px] tracking-wide mt-5"
          >
            STAFF EMAIL
            <input
              v-model="email"
              type="email"
              required
              autocomplete="username"
              class="input-field mt-2"
              placeholder="you@institution.edu"
            />
          </label>

          <label
            class="block text-ink font-mono text-[11px] tracking-wide mt-5"
          >
            PASSWORD
            <PasswordInput
              v-model="password"
              class="mt-2"
              autocomplete="current-password"
              :required="true"
            />
          </label>

          <p v-if="errorMsg" class="mt-4 text-sm text-danger">{{ errorMsg }}</p>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label class="flex items-center gap-2.5 text-sm text-ink">
              <input
                v-model="remember"
                type="checkbox"
                class="h-[18px] w-[18px] accent-cyan"
              />
              Remember Me on this device
            </label>
            <button
              type="button"
              class="shrink-0 text-sm font-medium text-cyan-dark hover:underline"
              @click="
                resetMode = true;
                resetEmail = email;
                resetStep = 'request';
                resetNotice = '';
                resetError = '';
              "
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-navy-light text-white rounded-md py-3.5 mt-6 text-lg font-bold hover:bg-navy transition-colors disabled:opacity-50"
          >
            {{ loading ? "Working..." : "Authenticate" }}
            <span class="text-cyan ml-4">→</span>
          </button>

          <p class="mt-4 text-center text-xs text-gray-500">
            Need an account? Ask a system administrator to add you under
            Settings → Staff Accounts.
          </p>
        </template>
      </form>
    </div>
  </div>
</template>
