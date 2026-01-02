// src/LoginPage.jsx
import React, { useState } from 'react';
import { loginApi } from './api';

function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [subdomain, setSubdomain] = useState('acme');
  const [email, setEmail] = useState('alice@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginApi({ email, password, subdomain });

      // store token
      localStorage.setItem('token', data.token);

      // try to get tenantId from login response
      if (data.tenantId) {
        localStorage.setItem('tenantId', String(data.tenantId));
      } else {
        // if not present, call /auth/me once to fetch it
        try {
          const meRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
            },
          });
          const meData = await meRes.json().catch(() => ({}));
          const src = meData.data || meData;
          if (src && src.tenantId) {
            localStorage.setItem('tenantId', String(src.tenantId));
          }
        } catch {
          // ignore secondary error; UsersPage will show a message if tenantId is missing
        }
      }

      if (onLoginSuccess) {
        onLoginSuccess(subdomain);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Tenant Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Subdomain</label>
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          type="button"
          onClick={onGoToRegister}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0066cc',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Don't have an account? Register here
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
