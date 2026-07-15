import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { PlannerPage } from './pages/PlannerPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlannerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
