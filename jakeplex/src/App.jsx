import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import MediaDetail from './pages/MediaDetail'
import Library from './pages/Library'
import Instructions from './pages/Instructions'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <ToastProvider>
      <Navbar />
      <Toast />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/library" element={<Library />} />
            <Route path="/instructions" element={<Instructions />} />
            <Route path="/movie/:id" element={<MediaDetail type="movie" />} />
            <Route path="/tv/:id" element={<MediaDetail type="tv" />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </AuthProvider>
    </ToastProvider>
  )
}

export default App
