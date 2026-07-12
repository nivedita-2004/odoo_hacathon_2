import { useState } from 'react'
import { BadgePlus, LockKeyhole, Mail, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getRoleDashboard } from '../../utils/roleRedirect'

const initialForm = { fullName: '', email: '', password: '', confirmPassword: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const [step, setStep] = useState('details')
  const [form, setForm] = useState(initialForm)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const { registerEmployee, verifyRegistration } = useAuth()
  const navigate = useNavigate()
  
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError('') }
  
  const submitDetails = async (event) => {
    event.preventDefault()
    if (Object.values(form).some((value) => !value.trim())) return setError('All fields are required.')
    if (!emailPattern.test(form.email.trim())) return setError('Enter a valid email address.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    
    const result = await registerEmployee(form)
    if (!result.success) return setError(result.error)
    
    setStep('otp')
    setError('')
  }

  const submitOtp = async (event) => {
    event.preventDefault()
    if (!otp) return setError('Please enter the OTP.')
    
    const result = await verifyRegistration(form.email, otp)
    if (!result.success) return setError(result.error)
    
    navigate(getRoleDashboard(result.user.role), { replace: true })
  }

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'Enter your full name', Icon: User },
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@company.com', Icon: Mail },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Minimum 8 characters', Icon: LockKeyhole },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Re-enter your password', Icon: LockKeyhole },
  ]

  return <section className="w-full rounded-sm border border-gray-200 bg-white p-10 shadow-xl">
    <div className="mb-7">
      <div className="mb-5 inline-flex rounded-sm shadow-sm bg-[#4f3448] p-3 text-white"><BadgePlus size={22} /></div>
      <h1 className="text-2xl font-semibold text-[#4f3448]">{step === 'details' ? 'Create employee account' : 'Verify Email'}</h1>
      <p className="mt-2 text-sm text-gray-600">{step === 'details' ? 'Join your workspace easily.' : `We sent a 6-digit code to ${form.email}.`}</p>
    </div>

    {error && <p className="mb-5 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
    
    {step === 'details' ? (
      <form className="space-y-4" onSubmit={submitDetails} noValidate>
        {fields.map(({ name, label, type, placeholder, Icon }) => (
          <label key={name} className="block text-sm font-medium text-gray-700">
            {label}
            <div className="relative mt-2">
              <Icon className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="w-full rounded-sm border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#4f3448] focus:bg-white focus:shadow-md" name={name} type={type} value={form[name]} onChange={update} placeholder={placeholder} />
            </div>
          </label>
        ))}
        <button className="w-full rounded-sm bg-[#4f3448] mt-2 px-4 py-2.5 font-medium text-white hover:bg-[#3f2939]" type="submit">Continue</button>
      </form>
    ) : (
      <form className="space-y-5" onSubmit={submitOtp}>
        <label className="block text-sm font-medium text-gray-700">
          Enter OTP
          <input className="mt-2 w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-[#4f3448] focus:bg-white focus:shadow-md text-center tracking-widest font-mono text-lg" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} inputMode="numeric" placeholder="------" autoFocus />
        </label>
        <button className="w-full rounded-sm bg-[#4f3448] px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:bg-[#3f2939] hover:shadow-lg active:scale-[0.98]" type="submit">Verify & Create Account</button>
        <button type="button" onClick={() => setStep('details')} className="w-full text-sm text-center text-gray-500 hover:text-gray-800">Back</button>
      </form>
    )}
    
    {step === 'details' && (
      <p className="mt-6 text-center text-sm text-gray-600">Already registered? <Link className="font-medium text-[#4f3448] underline" to="/login">Sign in</Link></p>
    )}
  </section>
}
