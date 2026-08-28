const USERS_KEY = 'asteri_demo_users_v1'
const SESSION_KEY = 'asteri_demo_session_v1'

const founder = {
  id: 'founder',
  email: 'founder@asteri.gg',
  password: 'ASTERI-DEMO',
  nickname: 'FOUNDER',
  role: 'Fundador',
  status: 'approved',
  isFounder: true,
  bio: 'Cuenta fundadora de demostración.',
  steam: '',
  faceit: '',
  config: { dpi: '', sensitivity: '', resolution: '', crosshair: '' }
}

export function seedDemoAuth() {
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify([founder]))
}

export function getUsers() {
  seedDemoAuth()
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function registerUser(data) {
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error('Ese email ya está registrado.')
  const user = {
    id: crypto.randomUUID(),
    email: data.email.trim(),
    password: data.password,
    nickname: data.nickname.trim().toUpperCase(),
    role: data.role || 'Jugador',
    status: 'pending',
    isFounder: false,
    bio: '', steam: '', faceit: '',
    config: { dpi: '', sensitivity: '', resolution: '', crosshair: '' }
  }
  saveUsers([...users, user])
  return user
}

export function loginUser(email, password) {
  const user = getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password)
  if (!user) throw new Error('Email o contraseña incorrectos.')
  if (user.status !== 'approved') throw new Error('La cuenta todavía espera aprobación del fundador.')
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser() {
  const id = localStorage.getItem(SESSION_KEY)
  return getUsers().find((u) => u.id === id) || null
}

export function approveUser(id) {
  const users = getUsers().map((u) => u.id === id ? { ...u, status: 'approved' } : u)
  saveUsers(users)
}

export function updateUser(id, patch) {
  const users = getUsers().map((u) => u.id === id ? { ...u, ...patch } : u)
  saveUsers(users)
  return users.find((u) => u.id === id)
}
