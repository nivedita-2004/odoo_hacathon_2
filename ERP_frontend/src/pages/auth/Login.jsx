import { useState } from 'react'
import { LockKeyhole, LogIn, Mail, Building, Plus, ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getRoleDashboard } from '../../utils/roleRedirect'
import { GoogleLogin } from '@react-oauth/google'
import { API_ENDPOINTS } from '../../config/apis'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const location = useLocation()
  const [step, setStep] = useState(location.state?.action === 'CREATE_WORKSPACE' ? 'create_workspace' : 'login')
  const [workspaces, setWorkspaces] = useState([])
  const [googleCred, setGoogleCred] = useState(null)
  const [setupToken, setSetupToken] = useState(location.state?.setupToken || null)
  const [newOrgName, setNewOrgName] = useState('')

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login, setUser } = useAuth()
  const navigate = useNavigate()
  
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError('') }
  
  const submit = async (event) => {
    event.preventDefault()
    if (!emailPattern.test(form.email.trim())) return setError('Enter a valid email address.')
    if (!form.password) return setError('Password is required.')
    
    const matched = await login(form.email, form.password)
    if (!matched) return setError('Invalid email or password.')
    
    if (matched.action === 'CREATE_WORKSPACE') {
      setSetupToken(matched.setupToken);
      setStep('create_workspace');
      return;
    } else if (matched.action === 'SELECT_WORKSPACE') {
      setWorkspaces(matched.workspaces);
      setSetupToken(matched.setupToken);
      setStep('select_workspace');
      return;
    }
    
    navigate(getRoleDashboard(matched.user.role), { replace: true })
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    setGoogleCred(credential);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.GOOGLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const result = await res.json();
      if (!result.success) return setError(result.error);

      if (result.action === 'LOGIN') {
        localStorage.setItem("assetflow_token", result.token);
        localStorage.setItem("assetflow_user", JSON.stringify(result.user));
        setUser(result.user);
        navigate(getRoleDashboard(result.user.role), { replace: true });
      } else if (result.action === 'SELECT_WORKSPACE') {
        setWorkspaces(result.workspaces);
        setStep('select_workspace');
      } else if (result.action === 'CREATE_WORKSPACE') {
        setStep('create_workspace');
      }
    } catch (err) {
      setError('Google login failed');
    }
  };

  const handleWorkspaceSelect = async (orgId) => {
    try {
      const endpoint = setupToken ? API_ENDPOINTS.AUTH.WORKSPACE_SELECT : API_ENDPOINTS.AUTH.GOOGLE_SELECT;
      const body = setupToken 
        ? { setupToken, organizationId: orgId }
        : { credential: googleCred, organizationId: orgId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem("assetflow_token", result.token);
        localStorage.setItem("assetflow_user", JSON.stringify(result.user));
        setUser(result.user);
        navigate(getRoleDashboard(result.user.role), { replace: true });
      } else setError(result.error);
    } catch (err) {
      setError('Failed to select workspace');
    }
  };

  const handleWorkspaceCreate = async (e) => {
    e.preventDefault();
    if(!newOrgName.trim()) return setError('Workspace name is required');
    try {
      const endpoint = setupToken ? API_ENDPOINTS.AUTH.WORKSPACE_CREATE : API_ENDPOINTS.AUTH.GOOGLE_CREATE;
      const body = setupToken 
        ? { setupToken, organizationName: newOrgName }
        : { credential: googleCred, organizationName: newOrgName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem("assetflow_token", result.token);
        localStorage.setItem("assetflow_user", JSON.stringify(result.user));
        setUser(result.user);
        navigate(getRoleDashboard(result.user.role), { replace: true });
      } else setError(result.error);
    } catch (err) {
      setError('Failed to create workspace');
    }
  };

  return <section className="w-full rounded-sm border border-gray-200 bg-white p-10 shadow-xl">
    <div className="mb-7">
      <div className="mb-5 inline-flex rounded-sm shadow-sm bg-[#4f3448] p-3 text-white"><LogIn size={22} /></div>
      <h1 className="text-2xl font-semibold text-[#4f3448]">
        {step === 'login' ? 'Welcome to AssetFlow' : step === 'select_workspace' ? 'Select Workspace' : 'Create Workspace'}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {step === 'login' ? 'Sign in to continue to your workspace.' : step === 'select_workspace' ? 'Choose an organization to join.' : 'Set up a new organization for your team.'}
      </p>
    </div>

    {error && <p className="mb-5 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
    {location.state?.signupSuccess && step === 'login' && <p className="mb-5 rounded-sm bg-green-50 px-3 py-2 text-sm text-green-700">Account created successfully. You can now sign in.</p>}

    {step === 'login' && (
      <>
        <form className="space-y-5" onSubmit={submit} noValidate>
          <label className="block text-sm font-medium text-gray-700">Email address<div className="relative mt-2"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-sm border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#4f3448] focus:bg-white focus:shadow-md" name="email" type="email" value={form.email} onChange={update} placeholder="you@company.com" /></div></label>
          <label className="block text-sm font-medium text-gray-700">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-sm border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#4f3448] focus:bg-white focus:shadow-md" name="password" type="password" value={form.password} onChange={update} placeholder="Enter your password" /></div></label>
          <div className="text-right"><Link className="text-sm font-medium text-[#4f3448] hover:underline" to="/forgot-password">Forgot password?</Link></div>
          <button className="w-full rounded-sm bg-[#4f3448] px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:bg-[#3f2939] hover:shadow-lg active:scale-[0.98]" type="submit">Sign in</button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b lg:w-1/4"></span>
          <span className="text-xs text-center text-gray-500 uppercase">or login with</span>
          <span className="w-1/5 border-b lg:w-1/4"></span>
        </div>

        <div className="mt-6 flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
            useOneTap
            width="100%"
          />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">New employee? <Link className="font-medium text-[#4f3448] underline" to="/signup">Create an account</Link></p>
      </>
    )}

    {step === 'select_workspace' && (
      <div className="space-y-3">
        {workspaces.map(ws => (
          <button key={ws.id} onClick={() => handleWorkspaceSelect(ws.id)} className="w-full flex items-center justify-between p-4 rounded-sm border border-gray-200 hover:border-[#4f3448] hover:bg-gray-50 transition-all hover:shadow-md text-left group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4f3448]/10 rounded-sm text-[#4f3448]"><Building size={20} /></div>
              <span className="font-medium text-gray-800">{ws.name}</span>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#4f3448]" />
          </button>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-100">
           <button onClick={() => setStep('create_workspace')} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-[#4f3448] border border-dashed border-[#4f3448] rounded-sm hover:bg-[#4f3448]/5 transition-colors">
              <Plus size={16} /> Create New Workspace
           </button>
        </div>
        <button onClick={() => setStep('login')} className="w-full mt-2 text-sm text-center text-gray-500 hover:text-gray-800">Cancel</button>
      </div>
    )}

    {step === 'create_workspace' && (
      <form onSubmit={handleWorkspaceCreate} className="space-y-5">
         <label className="block text-sm font-medium text-gray-700">Workspace Name<div className="relative mt-2"><Building className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full rounded-sm border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-[#4f3448] focus:bg-white focus:shadow-md" type="text" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="Acme Corp" autoFocus /></div></label>
         <button className="w-full rounded-sm bg-[#4f3448] px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:bg-[#3f2939] hover:shadow-lg active:scale-[0.98]" type="submit">Create Workspace</button>
         <button type="button" onClick={() => workspaces.length > 0 ? setStep('select_workspace') : setStep('login')} className="w-full text-sm text-center text-gray-500 hover:text-gray-800">Cancel</button>
      </form>
    )}
  </section>
}
