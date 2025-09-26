import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TestComponent from './MyComponent'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TestComponent />
  </StrictMode>,
)
