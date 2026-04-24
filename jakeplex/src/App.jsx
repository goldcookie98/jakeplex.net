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
import MyRequests from './pages/MyRequests'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="server-down-banner">
          <span>SERVER DOWN</span>
          <div className="server-down-explanation">
            <p><strong>Root Cause:</strong> An external hard drive enclosure lost connection to the server due to a brief voltage drop caused by a nearby air conditioning unit's inrush current. This caused ZFS storage pools to enter an error state.</p>
            <p><strong>Status:</strong> No data was lost. Last verified data integrity check (scrub) completed successfully on 19th April 2026 with zero errors.</p>
          </div>
        </div>
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/library" element={<Library />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/requests" element={<MyRequests />} />
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
