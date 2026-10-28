import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { installPressedFeedback } from './lib/pressed'
import { applyTheme, getThemePref } from './lib/theme'

registerSW({ immediate: true })
// data-theme setzt schon das Skript in index.html; hier folgen noch die theme-color-Metas
applyTheme(getThemePref())
installPressedFeedback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
