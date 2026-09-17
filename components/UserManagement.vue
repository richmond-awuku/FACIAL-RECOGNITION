<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

type UserRow = {
  id: string | number
  name: string
  email: string
  role: 'Student' | 'Lecturer' | 'Administrator'
  department: string
  status: 'Active' | 'Inactive'
  lastLogin: string
}

const query = ref('')
const roleFilter = ref('All Roles')
const statusFilter = ref('All Statuses')
const users = ref<UserRow[]>([])
const loading = ref(true)
const error = ref('')
const api = useApi()
const showAddUser = ref(false)
const addingUser = ref(false)
const addUserError = ref('')
const newUser = ref({ fullName: '', email: '', role: 'LECTURER', department: '' })

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const students = await api.getStudents()
    users.value = students.map((student: any) => ({
      id: student.id,
      name: student.full_name || student.student_id || 'Unnamed student',
      email: student.email || '',
      role: 'Student',
      department: student.department || '—',
      status: student.is_active === false ? 'Inactive' : 'Active',
      lastLogin: student.last_login || student.last_seen
        ? new Date(student.last_login || student.last_seen).toLocaleString()
        : 'Never',
    }))
  } catch (e: any) {
    error.value = e?.message || 'Unable to load users.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

const roleCounts = computed(() => ({
  Student: users.value.filter((user) => user.role === 'Student').length,
  Lecturer: users.value.filter((user) => user.role === 'Lecturer').length,
  Administrator: users.value.filter((user) => user.role === 'Administrator').length,
}))

const filteredUsers = computed(() => users.value.filter((user) => {
  const needle = query.value.toLowerCase()
  return (!needle || `${user.name} ${user.email} ${user.department}`.toLowerCase().includes(needle))
    && (roleFilter.value === 'All Roles' || user.role === roleFilter.value)
    && (statusFilter.value === 'All Statuses' || user.status === statusFilter.value)
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
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">User Management</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">Manage students, lecturers and administrators.</p>
      </div>
      <button class="btn-primary" @click="showAddUser = true">＋ Add User</button>
    </div>

    <div class="grid grid-cols-4 gap-5">
      <article v-for="stat in [
        { label: 'Total Users', value: users.length, color: 'text-cyan' },
        { label: 'Students', value: roleCounts.Student, color: 'text-cyan' },
        { label: 'Lecturers', value: roleCounts.Lecturer, color: 'text-danger' },
        { label: 'Administrators', value: roleCounts.Administrator, color: 'text-purple-500' },
      ]" :key="stat.label" class="overview-card min-h-[120px]">
        <span class="font-mono text-xs text-gray-500">{{ stat.label }}</span>
        <strong class="overview-stat text-4xl">{{ stat.value }}</strong>
        <span :class="stat.color" class="text-xs">↑ 10% <span class="text-gray-400">vs last month</span></span>
      </article>
    </div>

    <article class="panel-surface overflow-hidden">
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading users...</p>
      <p v-else-if="error" class="p-6 text-sm text-danger">{{ error }}</p>
      <div class="flex items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
        <input v-model="query" class="input-field max-w-[440px]" placeholder="Search users..." />
        <select v-model="roleFilter" class="btn-outline"><option>All Roles</option><option>Student</option><option>Lecturer</option><option>Administrator</option></select>
        <select v-model="statusFilter" class="btn-outline"><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
        <button class="btn-outline">⚑ Filter</button>
      </div>
      <table v-if="!loading && !error" class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td><div class="flex items-center gap-3"><span class="avatar-pill">{{ initials(user.name) }}</span><strong>{{ user.name }}</strong></div></td>
            <td class="text-gray-500">{{ user.email }}</td>
            <td><span class="mini-pill">{{ user.role }}</span></td>
            <td>{{ user.department }}</td>
            <td><span class="status-tag status-verified">{{ user.status }}</span></td>
            <td class="font-mono text-xs text-gray-500">{{ user.lastLogin }}</td>
            <td><button class="table-action-btn">•••</button></td>
          </tr>
        </tbody>
      </table>
      <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredUsers.length }} of {{ users.length }} users</div>
    </article>

    <div v-if="showAddUser" class="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4" @click.self="showAddUser = false">
      <form class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" @submit.prevent="addUser">
        <div class="flex items-start justify-between gap-4">
          <div><h2 class="text-xl font-semibold">Add user</h2><p class="mt-1 text-sm text-gray-500">A temporary password will be sent by the backend.</p></div>
          <button type="button" class="text-xl text-gray-500" @click="showAddUser = false">×</button>
        </div>
        <p v-if="addUserError" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{{ addUserError }}</p>
        <div class="mt-5 grid gap-4">
          <label class="text-xs font-mono uppercase text-gray-500">Full name<input v-model="newUser.fullName" class="input-field mt-2" required /></label>
          <label class="text-xs font-mono uppercase text-gray-500">Email<input v-model="newUser.email" type="email" class="input-field mt-2" required /></label>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <label class="text-xs font-mono uppercase text-gray-500">Role<select v-model="newUser.role" class="input-field mt-2"><option value="LECTURER">Lecturer</option><option value="ADMIN">Administrator</option></select></label>
            <label class="text-xs font-mono uppercase text-gray-500">Department<input v-model="newUser.department" class="input-field mt-2" /></label>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3"><button type="button" class="btn-outline" @click="showAddUser = false">Cancel</button><button class="btn-primary" :disabled="addingUser">{{ addingUser ? 'Creating...' : 'Create user' }}</button></div>
      </form>
    </div>
  </section>
</template>
