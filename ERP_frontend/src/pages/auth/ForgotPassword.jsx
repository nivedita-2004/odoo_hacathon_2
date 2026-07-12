import { useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const { requestPasswordOtp } = useAuth()

  const sendOtp = (event) => {
    event.preventDefault()
    setError('')
    if (!emailPattern.test(email.trim())) return setError('Enter a valid email address.')
    const result = requestPasswordOtp(email)
    if (!result.success) return setError(result.error)
    setSentOtp(result.otp)
  }

  const verifyOtp = (event) => {
    event.preventDefault()
    setError('')
    if (otp !== sentOtp) return setError('Invalid OTP. Please try again.')
    setVerified(true)
  }

  return <section className="w-full rounded-xl border border-[#dfd5dc] bg-white p-8 shadow-sm">
    <div className="mb-7"><div className="mb-4 inline-flex rounded-lg bg-[#4f3448] p-3 text-white"><KeyRound size={22} /></div><h1 className="text-2xl font-semibold text-[#4f3448]">Forgot password</h1><p className="mt-2 text-sm text-gray-600">Enter your registered email to receive an OTP.</p></div>
    {!sentOtp ? <form className="space-y-5" onSubmit={sendOtp} noValidate>
      <label className="block text-sm font-medium text-gray-700">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-[#4f3448]" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@company.com" /></div></label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white hover:bg-[#3f2939]" type="submit">Send OTP</button>
    </form> : verified ? <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">Email verified successfully. Password reset will be connected with the backend later.</div> : <form className="space-y-5" onSubmit={verifyOtp}>
      <p className="rounded-lg bg-[#f7f3f6] p-3 text-sm text-[#4f3448]">Dummy OTP sent to {email}: <strong>123456</strong></p>
      <label className="block text-sm font-medium text-gray-700">Enter OTP<input className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#4f3448]" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} inputMode="numeric" placeholder="6-digit OTP" /></label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white hover:bg-[#3f2939]" type="submit">Verify OTP</button>
    </form>}
    <p className="mt-6 text-center text-sm"><Link className="font-medium text-[#4f3448] hover:underline" to="/login">Back to login</Link></p>
  </section>
}
