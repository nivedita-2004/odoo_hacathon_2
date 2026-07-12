import { useState } from 'react'
import { LockKeyhole, LogIn, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getRoleDashboard } from '../../utils/roleRedirect'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError('') }
  const submit = (event) => {
    event.preventDefault()
    if (!emailPattern.test(form.email.trim())) return setError('Enter a valid email address.')
    if (!form.password) return setError('Password is required.')
    const matched = login(form.email, form.password)
    if (!matched) return setError('Invalid email or password.')
    navigate(getRoleDashboard(matched.role), { replace: true })
  }

  return <section className="w-full rounded-xl border border-[#dfd5dc] bg-white p-8 shadow-sm">
    <div className="mb-7"><div className="mb-4 inline-flex rounded-lg bg-[#4f3448] p-3 text-white"><LogIn size={22} /></div><h1 className="text-2xl font-semibold text-[#4f3448]">Welcome to AssetFlow</h1><p className="mt-2 text-sm text-gray-600">Sign in to continue to your workspace.</p></div>
    {location.state?.signupSuccess && <p className="mb-5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Account created successfully. You can now sign in.</p>}
    <form className="space-y-5" onSubmit={submit} noValidate>
      <label className="block text-sm font-medium text-gray-700">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]" name="email" type="email" value={form.email} onChange={update} placeholder="you@company.com" /></div></label>
      <label className="block text-sm font-medium text-gray-700">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]" name="password" type="password" value={form.password} onChange={update} placeholder="Enter your password" /></div></label>
      <div className="text-right"><Link className="text-sm font-medium text-[#4f3448] hover:underline" to="/forgot-password">Forgot password?</Link></div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white hover:bg-[#3f2939]" type="submit">Sign in</button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-600">New employee? <Link className="font-medium text-[#4f3448] underline" to="/signup">Create an account</Link></p>
  </section>
}
