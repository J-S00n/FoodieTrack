import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react';

// const domain = import.meta.env.VITE_AUTH0_DOMAIN;
// const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

// console.log('Auth0 Domain:', domain);
// console.log('Auth0 Client ID:', clientId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-wxq13kkpc6n1xlyo.us.auth0.com"
      clientId="C4TBJ0kXjjPa52DU1YhdoQ1Q3lyJwuVi"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
