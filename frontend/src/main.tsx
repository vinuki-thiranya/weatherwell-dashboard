import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {domain && clientId ? (
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
      >
        <App />
      </Auth0Provider>
    ) : (
      <div className="p-10 text-red-600 font-bold bg-white min-h-screen">
        Auth0 Configuration Missing! Check your .env file.
        <br />Required: VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID
      </div>
    )}
  </StrictMode>,
)
