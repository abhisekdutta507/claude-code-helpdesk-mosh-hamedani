import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import UsersPage from '@/pages/UsersPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
