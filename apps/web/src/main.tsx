import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/figtree/wght.css'
import './index.css'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
)
