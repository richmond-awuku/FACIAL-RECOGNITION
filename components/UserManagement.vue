<script setup lang="ts">
import { computed, ref } from 'vue'

type UserRow = {
  id: number
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
const users = ref<UserRow[]>([
  { id: 1, name: 'Emmanuel Mensah', email: 'emmanuel@school.edu', role: 'Student', department: 'Computer Science', status: 'Active', lastLogin: 'Sep 6, 2025 10:24 AM' },
  { id: 2, name: 'Michael Chen', email: 'michael@school.edu', role: 'Student', department: 'Computer Science', status: 'Active', lastLogin: 'Sep 6, 2025 09:47 AM' },
  { id: 3, name: 'Elena Rodriguez', email: 'elena@school.edu', role: 'Student', department: 'Electrical Eng.', status: 'Active', lastLogin: 'Sep 6, 2025 07:12 AM' },
  { id: 4, name: 'David Kim', email: 'david@school.edu', role: 'Student', department: 'Mechanical Eng.', status: 'Active', lastLogin: 'Sep 5, 2025 04:32 PM' },
  { id: 5, name: 'Aisha Patel', email: 'aisha@school.edu', role: 'Lecturer', department: 'Computer Science', status: 'Active', lastLogin: 'Sep 5, 2025 02:16 PM' },
  { id: 6, name: 'Sarah Jenkins', email: 'sarah@school.edu', role: 'Lecturer', department: 'Electrical Eng.', status: 'Active', lastLogin: 'Sep 5, 2025 11:03 AM' },
  { id: 7, name: 'Admin User', email: 'admin@school.edu', role: 'Administrator', department: 'IT Department', status: 'Active', lastLogin: 'Sep 4, 2025 08:41 AM' },
])

const filteredUsers = computed(() => users.value.filter((user) => {
  const needle = query.value.toLowerCase()
  return (!needle || `${user.name} ${user.email} ${user.department}`.toLowerCase().includes(needle))
    && (roleFilter.value === 'All Roles' || user.role === roleFilter.value)
    && (statusFilter.value === 'All Statuses' || user.status === statusFilter.value)
}))

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">User Management</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">Manage students, lecturers and administrators.</p>
      </div>
      <button class="btn-primary">＋ Add User</button>
    </div>

    <div class="grid grid-cols-4 gap-5">
      <article v-for="stat in [
        { label: 'Total Users', value: '1,248', color: 'text-cyan' },
        { label: 'Students', value: '1,020', color: 'text-cyan' },
        { label: 'Lecturers', value: '182', color: 'text-danger' },
        { label: 'Administrators', value: '46', color: 'text-purple-500' },
      ]" :key="stat.label" class="overview-card min-h-[120px]">
        <span class="font-mono text-xs text-gray-500">{{ stat.label }}</span>
        <strong class="overview-stat text-4xl">{{ stat.value }}</strong>
        <span :class="stat.color" class="text-xs">↑ 10% <span class="text-gray-400">vs last month</span></span>
      </article>
    </div>

    <article class="panel-surface overflow-hidden">
      <div class="flex items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
        <input v-model="query" class="input-field max-w-[440px]" placeholder="Search users..." />
        <select v-model="roleFilter" class="btn-outline"><option>All Roles</option><option>Student</option><option>Lecturer</option><option>Administrator</option></select>
        <select v-model="statusFilter" class="btn-outline"><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
        <button class="btn-outline">⚑ Filter</button>
      </div>
      <table class="data-table">
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
  </section>
</template>
