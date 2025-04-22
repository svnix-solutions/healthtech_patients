import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { FrappeProvider } from 'frappe-react-sdk'
import { Button } from "@/components/ui/button"
import { Home } from '@/pages/Home'
import { About } from '@/pages/About'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { AuthProvider, useAuth } from '@/context/AuthContext'

function Navigation() {
  const { currentUser, logout } = useAuth()
  
  return (
    <nav>
      <ul className="flex space-x-4 p-4">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        {currentUser ? (
          <>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  )
}

function App() {
  return (
    <div className="App">
      <FrappeProvider>
        <AuthProvider>
          <Router basename="/frontend">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Router>
        </AuthProvider>
      </FrappeProvider>
    </div>
  )
}

export default App
