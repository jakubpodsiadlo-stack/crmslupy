import { Link } from 'react-router-dom'
import { PylonIcon } from './icons/PylonIcon'
import '../auth/auth.css'

export function AuthShell({ eyebrow, title, subtitle, children, footer, titleClassName }) {
  const titleClass = titleClassName ?? 'auth-card__title'
  return (
    <div className="auth-page">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__grid">
        <aside className="auth-page__brand">
          <Link to="/login" className="auth-page__logo auth-page__logo--brand">
            <span className="auth-page__mark" aria-hidden>
              <PylonIcon className="auth-page__pylon-svg" />
            </span>
            <span className="auth-page__wordmark">EASYEKO</span>
          </Link>
        </aside>
        <main className="auth-page__panel">
          <div className="auth-card">
            {eyebrow ? <p className="auth-card__eyebrow">{eyebrow}</p> : null}
            <h1 className={titleClass}>{title}</h1>
            {subtitle ? <p className="auth-card__subtitle">{subtitle}</p> : null}
            {children}
            {footer ? <div className="auth-footer">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  )
}
