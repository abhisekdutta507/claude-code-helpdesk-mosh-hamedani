import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>("Checking API...")

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setApiStatus(`API status: ${data.status}`))
      .catch(() => setApiStatus("API unreachable"))
  }, [])

  return (
    <>
      <h1>Helpdesk</h1>
      <p>{apiStatus}</p>
    </>
  )
}

export default App
