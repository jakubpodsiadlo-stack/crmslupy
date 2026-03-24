import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthShell } from '../components/AuthShell'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)
    const { error: err } = await resetPassword(email.trim())
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    setInfo('Jeśli konto istnieje, wysłaliśmy link do resetu hasła.')
  }

  return (
    <AuthShell
      eyebrow="Bezpieczeństwo"
      title="Reset hasła"
      subtitle="Podaj adres konta — wyślemy link do ustawienia nowego hasła. W Supabase dodaj redirect na /auth/update-password."
      footer={<Link to="/login">Wróć do logowania</Link>}
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="forgot-email">
            Adres e-mail
          </label>
          <input
            id="forgot-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="twoj@email.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
        {info ? <p className="auth-alert auth-alert--success">{info}</p> : null}
        <button className="auth-btn" type="submit" disabled={pending}>
          {pending ? 'Wysyłanie…' : 'Wyślij link resetujący'}
        </button>
      </form>
    </AuthShell>
  )
}
