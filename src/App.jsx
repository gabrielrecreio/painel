import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AdminPage from './pages/AdminPage'
import TvPage from './pages/TvPage'
import LoginPage from './pages/LoginPage'

// Rota protegida: exige login para acessar /admin
function PrivateRoute({ children }) {
  const { session } = useAuth()

  // Ainda carregando a sessão
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gb-charcoal">
        <svg className="animate-spin h-10 w-10 text-gb-red" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  // Não logado → redireciona para login
  if (!session) return <Navigate to="/login" replace />

  return children
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      {/* Login — redireciona para /admin se já estiver logado */}
      <Route
        path="/login"
        element={session ? <Navigate to="/admin" replace /> : <LoginPage />}
      />

      {/* Admin — protegida */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminPage />
          </PrivateRoute>
        }
      />

      {/* TV — pública, sem autenticação */}
      <Route path="/tv" element={<TvPage />} />

      {/* Redirect padrão */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
