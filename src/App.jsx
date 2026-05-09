import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<div className="p-8">Dashboard — coming soon</div>} />
        <Route path="/tasks" element={<div className="p-8">Tasks — coming soon</div>} />
      </Routes>
    </>
  )
}
