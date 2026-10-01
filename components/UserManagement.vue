<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'

type UserRow = {
  id: string | number
  name: string
  username: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Inactive'
  lastLogin: string
}

const api = useApi()
const query = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const users = ref<UserRow[]>([])
const loading = ref(true)
const error = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
let requestSequence = 0

const showAddUser = ref(false)
const addingUser = ref(false)
const addUserError = ref('')
const newUser = ref({ fullName: '', email: '', role: 'LECTURER', department: '' })

function mapUser(user: any): UserRow {
  const rawRole = String(user.role || user.user_role || '').toUpperCase()
  return {
    id: user.id,
    name: user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Unnamed user',
    username: user.username || '',
    email: user.email || '',
    role: rawRole === 'ADMIN' ? 'Administrator' : rawRole === 'LECTURER' ? 'Lecturer' : rawRole === 'STUDENT' ? 'Student' : rawRole || 'Unknown',
    department: user.department || user.student?.department || '',
    status: user.is_active === false ? 'Inactive' : 'Active',
    lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
  }
}

async function loadUsers() {
  const sequence = ++requestSequence
  loading.value = true
  error.value = ''
  try {
    const rows = await api.getUsers({
      search: query.value,
      role: roleFilter.value,
      is_active: statusFilter.value === '' ? '' : statusFilter.value === 'Active',
    })
    if (sequence === requestSequence) users.value = rows.map(mapUser)
  } catch (e: any) {
    if (sequence === requestSequence) error.value = e?.message || 'Unable to load users.'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

onMounted(loadUsers)
watch([query, roleFilter, statusFilter], () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadUsers, query.value.trim() ? 300 : 0)
})

const roleCounts = computed(() => ({
  Student: users.value.filter((user) => user.role === 'Student').length,
  Lecturer: users.value.filter((user) => user.role === 'Lecturer').length,
  Administrator: users.value.filter((user) => user.role === 'Administrator').length,
}))
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

async function addUser() {
  addUserError.value = ''
  if (!newUser.value.fullName.trim() || !newUser.value.email.trim()) {
    addUserError.value = 'Full name and email are required.'
    return
  }
  addingUser.value = true
  try {
    const parts = newUser.value.fullName.trim().split(/\s+/)
    await api.createUser({
      username: newUser.value.email.trim(),
      email: newUser.value.email.trim(),
      first_name: parts.shift() || '',
      last_name: parts.join(' '),
      role: newUser.value.role,
      department: newUser.value.department.trim() || undefined,
    })
    showAddUser.value = false
    newUser.value = { fullName: '', email: '', role: 'LECTURER', department: '' }
    await loadUsers()
  } catch (e: any) {
    addUserError.value = e?.payload?.detail || e?.message || 'Unable to create user.'
  } finally {
    addingUser.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">User Management</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">Manage students, lecturers and administrators.</p>
      </div>
      <button class="btn-primary" @click="showAddUser = true">＋ Add User</button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="stat in [
        { label: 'Total Users', value: users.length, color: 'text-cyan' },
        { label: 'Students', value: roleCounts.Student, color: 'text-cyan' },
        { label: 'Lecturers', value: roleCounts.Lecturer, color: 'text-danger' },
        { label: 'Administrators', value: roleCounts.Administrator, color: 'text-purple-500' },
      ]" :key="stat.label" class="overview-card min-h-[120px]">
        <span class="font-mono text-xs text-gray-500">{{ stat.label }}</span>
        <strong class="overview-stat text-4xl">{{ stat.value }}</strong>
      </article>
    </div>

    <article class="panel-surface overflow-x-auto">
      <div class="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
        <input v-model="query" class="input-field min-w-[220px] max-w-[440px] flex-1" placeholder="Search name, username, or email..." />
        <select v-model="roleFilter" class="btn-outline">
          <option value="">All Roles</option><option value="STUDENT">Student</option><option value="LECTURER">Lecturer</option><option value="ADMIN">Administrator</option>
        </select>
        <select v-model="statusFilter" class="btn-outline">
          <option value="">All Statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
        </select>
      </div>
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading users...</p>
      <p v-else-if="error" class="p-6 text-sm text-danger">{{ error }}</p>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th></tr></thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td><div class="flex items-center gap-3"><span class="avatar-pill">{{ initials(user.name) }}</span><strong>{{ user.name }}</strong></div></td>
                <td>{{ user.username || '—' }}</td><td class="text-gray-500">{{ user.email || '—' }}</td>
                <td><span class="mini-pill">{{ user.role }}</span></td><td>{{ user.department || '—' }}</td>
                <td><span class="status-tag" :class="user.status === 'Active' ? 'status-verified' : 'status-pending'">{{ user.status }}</span></td>
                <td class="font-mono text-xs text-gray-500">{{ user.lastLogin }}</td>
              </tr>
              <tr v-if="users.length === 0"><td colspan="7" class="text-center text-gray-500">No users match these filters.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ users.length }} users</div>
      </template>
    </article>

    <BaseModal
      :show="showAddUser"
      title="Add User"
      message="Create a lecturer or administrator account. The backend provisions the account and credentials."
      :button-text="addingUser ? 'Creating...' : 'Create User'"
      @close="showAddUser = false"
      @confirm="addUser"
    >
      <div class="space-y-4 text-left">
        <p v-if="addUserError" class="text-sm text-danger">{{ addUserError }}</p>
        <label class="block font-mono text-[11px]">FULL NAME<input v-model="newUser.fullName" class="input-field mt-2" required /></label>
        <label class="block font-mono text-[11px]">EMAIL<input v-model="newUser.email" type="email" class="input-field mt-2" required /></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block font-mono text-[11px]">ROLE<select v-model="newUser.role" class="input-field mt-2"><option value="LECTURER">Lecturer</option><option value="ADMIN">Administrator</option></select></label>
          <label class="block font-mono text-[11px]">DEPARTMENT<input v-model="newUser.department" class="input-field mt-2" /></label>
        </div>
      </div>
    </BaseModal>
  </section>
</template>
