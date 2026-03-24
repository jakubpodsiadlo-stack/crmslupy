import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'

/** Strona z maila resetującego hasło (redirectTo w resetPasswordForEmail). */
export function UpdatePasswordPage() {
  const { updatePassword, session } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError('Hasła muszą być takie same.')
      return
    }
    if (password.length < 6) {
      setError('Hasło min. 6 znaków.')
      return
    }
    setPending(true)
    const { error: err } = await updatePassword(password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/', { replace: true })
  }

  if (!session) {
    return (
      <AuthShell
        eyebrow="Sesja"
        title="Link z e-maila"
        subtitle="Otwórz wiadomość resetującą w tej samej przeglądarce albo wklej pełny adres z maila, żeby odświeżyć sesję odzyskiwania."
        footer={<Link to="/login">Przejdź do logowania</Link>}
      >
        <p className="auth-hint">
          Brak aktywnej sesji recovery — bez niej nie zmienisz hasła z tej strony.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Nowe hasło"
      title="Ustaw bezpieczne hasło"
      subtitle="Wybierz co najmniej 6 znaków. Unikaj haseł używanych gdzie indziej."
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <PasswordField
          label="Nowe hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          id="upd-pw-1"
          required
        />
        <PasswordField
          label="Powtórz hasło"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          id="upd-pw-2"
          required
        />
        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
        <button className="auth-btn" type="submit" disabled={pending}>
          {pending ? 'Zapisywanie…' : 'Zapisz nowe hasło'}
        </button>
      </form>
    </AuthShell>
  )
}
