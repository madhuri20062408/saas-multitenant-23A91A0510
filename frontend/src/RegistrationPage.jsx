// src/RegistrationPage.jsx
import React, { useState } from 'react';

function RegistrationPage({ onRegistrationSuccess, onGoToLogin }) {
  const [tenantName, setTenantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantName,
          subdomain: subdomain.toLowerCase(),
          adminName,
          adminEmail: adminEmail.toLowerCase(),
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      
      setTimeout(() => {
        if (onRegistrationSuccess) {
          onRegistrationSuccess(subdomain);
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Tenant Registration</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Create a new organization account
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Organization Name *</label>
          <input
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="Acme Inc"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Subdomain *</label>
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            required
            pattern="[a-z0-9-]+"
            style={{ width: '100%', padding: '8px' }}
            placeholder="acme"
          />
          <small style={{ color: '#666' }}>
            Your login URL: {subdomain || 'subdomain'}.yourapp.com
          </small>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Admin Name *</label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="John Doe"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Admin Email *</label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="admin@acme.com"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password *</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Min 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', marginBottom: 10 }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <button
          type="button"
          onClick={onGoToLogin}
          style={{ width: '100%', padding: '10px', background: '#f0f0f0', border: '1px solid #ccc' }}
        >
          Already have an account? Login
        </button>
      </form>

      {success && <p style={{ color: 'green', marginTop: 10 }}>{success}</p>}
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
}

export default RegistrationPage;
