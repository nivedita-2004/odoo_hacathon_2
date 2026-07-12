import { useState } from 'react'
import { BadgePlus, LockKeyhole, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const initialForm = { fullName: '', email: '', password: '', confirmPassword: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const { registerEmployee } = useAuth()
  const navigate = useNavigate()
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError('') }
  const submit = (event) => {
    event.preventDefault()
    if (Object.values(form).some((value) => !value.trim())) return setError('All fields are required.')
    if (!emailPattern.test(form.email.trim())) return setError('Enter a valid email address.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    const result = registerEmployee(form)
    if (!result.success) return setError(result.error)
    navigate('/login', { replace: true, state: { signupSuccess: true } })
  }
  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'Enter your full name', Icon: User },
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@company.com', Icon: Mail },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Minimum 8 characters', Icon: LockKeyhole },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Re-enter your password', Icon: LockKeyhole },
  ]

  return <section className="w-full rounded-xl border border-[#dfd5dc] bg-white p-8 shadow-sm">
    <div className="mb-7"><div className="mb-4 inline-flex rounded-lg bg-[#4f3448] p-3 text-white"><BadgePlus size={22} /></div><h1 className="text-2xl font-semibold text-[#4f3448]">Create employee account</h1><p className="mt-2 text-sm text-gray-600">Your Employee ID will be generated automatically.</p></div>
    <form className="space-y-4" onSubmit={submit} noValidate>
      {fields.map(({ name, label, type, placeholder, Icon }) => <label key={name} className="block text-sm font-medium text-gray-700">{label}<div className="relative mt-2"><Icon className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]" name={name} type={type} value={form[name]} onChange={update} placeholder={placeholder} /></div></label>)}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white hover:bg-[#3f2939]" type="submit">Create employee account</button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-600">Already registered? <Link className="font-medium text-[#4f3448] underline" to="/login">Sign in</Link></p>
  </section>
}
