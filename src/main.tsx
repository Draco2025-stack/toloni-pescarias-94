import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { autoBootstrapAdmin } from './utils/adminBootstrap'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { applySecurity, detectSuspiciousActivity } from './utils/securityConfig'

// Aplicar configurações de segurança
applySecurity()

// Detectar atividades suspeitas
detectSuspiciousActivity()

// Executar bootstrap do admin no ambiente de desenvolvimento
autoBootstrapAdmin()

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
