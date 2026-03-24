import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'

export function RegisterPage() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)
    const { error: err } = await signUp(email.trim(), password, fullName.trim())
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    setInfo(
      'Konto utworzone. Jeśli włączona jest weryfikacja e-mail, sprawdź skrzynkę.',
    )
  }

  return (
    <AuthShell
      eyebrow="Rejestracja"
      title="Dołącz do zespołu"
      subtitle="Uzupełnij dane — dostaniesz dostęp do panelu zgodnie z przydzieloną rolą."
      footer={<Link to="/login">Masz już konto? Zaloguj się</Link>}
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-name">
            Imię i nazwisko
          </label>
          <input
            id="reg-name"
            className="auth-input"
            type="text"
            autoComplete="name"
            placeholder="Jan Kowalski"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">
            Adres e-mail
          </label>
          <input
            id="reg-email"
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
          autoComplete="new-password"
          minLength={6}
          required
        />
        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
        {info ? <p className="auth-alert auth-alert--success">{info}</p> : null}
        <button className="auth-btn" type="submit" disabled={pending}>
          {pending ? 'Tworzenie konta…' : 'Utwórz konto'}
        </button>
      </form>
    </AuthShell>
  )
}
