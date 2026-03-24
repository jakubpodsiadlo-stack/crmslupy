import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: err } = await signIn(email.trim(), password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthShell
      title="Zaloguj się"
      titleClassName="auth-card__title--pylon"
      footer={
        <>
          <Link to="/forgot-password">Nie pamiętasz hasła?</Link>
          <span className="auth-footer__sep" aria-hidden>
            ·
          </span>
          <Link to="/register">Załóż konto</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            Adres e-mail
          </label>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="twoj@email.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <PasswordField
          label="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
        <button className="auth-btn" type="submit" disabled={pending}>
          {pending ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
    </AuthShell>
  )
}
