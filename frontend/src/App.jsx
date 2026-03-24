import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { BackOfficePulpitPage } from './pages/BackOfficePulpitPage'
import { BackOfficeStartPage } from './pages/BackOfficeStartPage'
import { BackOfficeArchiwumUmowPage } from './pages/BackOfficeArchiwumUmowPage'
import { BackOfficeUmowyPage } from './pages/BackOfficeUmowyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DyrektorPunktyPage } from './pages/DyrektorPunktyPage'
import { DyrektorStartPage } from './pages/DyrektorStartPage'
import { DyrektorUmowyPage } from './pages/DyrektorUmowyPage'
import { HandlowiecPunktyPage } from './pages/HandlowiecPunktyPage'
import { HandlowiecUmowyPage } from './pages/HandlowiecUmowyPage'
import { HandlowiecStartPage } from './pages/HandlowiecStartPage'
import { HomePage } from './pages/HomePage'
import { InfoliniaArchiwumPage } from './pages/InfoliniaArchiwumPage'
import { InfoliniaOdczytKodowPage } from './pages/InfoliniaOdczytKodowPage'
import { InfoliniaPanel } from './pages/InfoliniaPanel'
import { InfoliniaStartPage } from './pages/InfoliniaStartPage'
import { LoginPage } from './pages/LoginPage'
import { MecenasGeneratorPage } from './pages/MecenasGeneratorPage'
import { MecenasKalendarzPage } from './pages/MecenasKalendarzPage'
import { MecenasRzeczoznawcyPage } from './pages/MecenasRzeczoznawcyPage'
import { MecenasStartPage } from './pages/MecenasStartPage'
import { MecenasUmowyPage } from './pages/MecenasUmowyPage'
import { PrezesLayout } from './layouts/PrezesLayout'
import { PrezesKosztyPage } from './pages/PrezesKosztyPage'
import { PrezesPanelePage } from './pages/PrezesPanelePage'
import { PrezesPrzegladPage } from './pages/PrezesPrzegladPage'
import { PrezesUmowyPage } from './pages/PrezesUmowyPage'
import { PrezesWykresyPage } from './pages/PrezesWykresyPage'
import { RegisterPage } from './pages/RegisterPage'
import { RzeczoznawcaGeoportalPage } from './pages/RzeczoznawcaGeoportalPage'
import { RzeczoznawcaKalendarzPage } from './pages/RzeczoznawcaKalendarzPage'
import { RzeczoznawcaNcrPage } from './pages/RzeczoznawcaNcrPage'
import { RzeczoznawcaStartPage } from './pages/RzeczoznawcaStartPage'
import { RzeczoznawcaUmowyPage } from './pages/RzeczoznawcaUmowyPage'
import { UpdatePasswordPage } from './pages/UpdatePasswordPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/panel/infolinia/start"
            element={
              <RoleRoute allow={['infolinia', 'administrator', 'prezes']}>
                <InfoliniaStartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/infolinia/kody"
            element={
              <RoleRoute allow={['infolinia', 'administrator', 'prezes']}>
                <InfoliniaOdczytKodowPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/infolinia/archiwum"
            element={
              <RoleRoute allow={['infolinia', 'administrator', 'prezes']}>
                <InfoliniaArchiwumPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/infolinia"
            element={
              <RoleRoute allow={['infolinia', 'administrator', 'prezes']}>
                <InfoliniaPanel />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/back-office"
            element={
              <RoleRoute allow={['backoffice', 'administrator', 'prezes']}>
                <BackOfficeStartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/back-office/start"
            element={<Navigate to="/panel/back-office" replace />}
          />
          <Route
            path="/panel/back-office/pulpit"
            element={
              <RoleRoute allow={['backoffice', 'administrator', 'prezes']}>
                <BackOfficePulpitPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/back-office/umowy"
            element={<Navigate to="/panel/back-office/umowy/zweryfikowana-infolinia" replace />}
          />
          <Route
            path="/panel/back-office/umowy/:boUmowyTab"
            element={
              <RoleRoute allow={['backoffice', 'administrator', 'prezes']}>
                <BackOfficeUmowyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/back-office/archiwum-umow"
            element={
              <RoleRoute allow={['backoffice', 'administrator', 'prezes']}>
                <BackOfficeArchiwumUmowPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/handlowiec"
            element={
              <RoleRoute allow={['handlowiec', 'administrator', 'prezes']}>
                <HandlowiecStartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/handlowiec/start"
            element={<Navigate to="/panel/handlowiec" replace />}
          />
          <Route
            path="/panel/handlowiec/umowy"
            element={
              <RoleRoute allow={['handlowiec', 'administrator', 'prezes']}>
                <HandlowiecUmowyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/handlowiec/punkty"
            element={
              <RoleRoute allow={['handlowiec', 'administrator', 'prezes']}>
                <HandlowiecPunktyPage />
              </RoleRoute>
            }
          />
          <Route path="/panel/handlowiec/kody" element={<Navigate to="/panel/handlowiec/umowy" replace />} />
          <Route
            path="/panel/dyrektor"
            element={
              <RoleRoute allow={['dyrektor', 'administrator', 'prezes']}>
                <DyrektorStartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/dyrektor/start"
            element={<Navigate to="/panel/dyrektor" replace />}
          />
          <Route
            path="/panel/dyrektor/umowy"
            element={
              <RoleRoute allow={['dyrektor', 'administrator', 'prezes']}>
                <DyrektorUmowyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/dyrektor/punkty"
            element={
              <RoleRoute allow={['dyrektor', 'administrator', 'prezes']}>
                <DyrektorPunktyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/rzeczoznawca"
            element={
              <RoleRoute allow={['rzeczoznawca', 'administrator', 'prezes']}>
                <RzeczoznawcaStartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/rzeczoznawca/start"
            element={<Navigate to="/panel/rzeczoznawca" replace />}
          />
          <Route
            path="/panel/rzeczoznawca/kalkulator"
            element={<Navigate to="/panel/rzeczoznawca/umowy/dostarczone" replace />}
          />
          <Route
            path="/panel/rzeczoznawca/umowy"
            element={<Navigate to="/panel/rzeczoznawca/umowy/dostarczone" replace />}
          />
          <Route
            path="/panel/rzeczoznawca/umowy/:tabSlug"
            element={
              <RoleRoute allow={['rzeczoznawca', 'administrator', 'prezes']}>
                <RzeczoznawcaUmowyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/rzeczoznawca/kalendarz"
            element={
              <RoleRoute allow={['rzeczoznawca', 'administrator', 'prezes']}>
                <RzeczoznawcaKalendarzPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/rzeczoznawca/geoportal"
            element={
              <RoleRoute allow={['rzeczoznawca', 'administrator', 'prezes']}>
                <RzeczoznawcaGeoportalPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/rzeczoznawca/ncr"
            element={
              <RoleRoute allow={['rzeczoznawca', 'administrator', 'prezes']}>
                <RzeczoznawcaNcrPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/mecenas"
            element={
              <RoleRoute allow={['mecenas', 'administrator', 'prezes']}>
                <MecenasStartPage />
              </RoleRoute>
            }
          />
          <Route path="/panel/mecenas/start" element={<Navigate to="/panel/mecenas" replace />} />
          <Route
            path="/panel/mecenas/umowy"
            element={
              <RoleRoute allow={['mecenas', 'administrator', 'prezes']}>
                <MecenasUmowyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/mecenas/rzeczoznawcy"
            element={
              <RoleRoute allow={['mecenas', 'administrator', 'prezes']}>
                <MecenasRzeczoznawcyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/mecenas/generator"
            element={
              <RoleRoute allow={['mecenas', 'administrator', 'prezes']}>
                <MecenasGeneratorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/mecenas/kalendarz"
            element={
              <RoleRoute allow={['mecenas', 'administrator', 'prezes']}>
                <MecenasKalendarzPage />
              </RoleRoute>
            }
          />
          <Route
            path="/panel/prezes"
            element={
              <RoleRoute allow={['prezes', 'administrator']}>
                <PrezesLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="przeglad" replace />} />
            <Route path="przeglad" element={<PrezesPrzegladPage />} />
            <Route path="umowy" element={<PrezesUmowyPage />} />
            <Route path="koszty" element={<PrezesKosztyPage />} />
            <Route path="wykresy" element={<PrezesWykresyPage />} />
            <Route path="panele" element={<PrezesPanelePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
