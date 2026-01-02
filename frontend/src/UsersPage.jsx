// src/UsersPage.jsx
import React, { useEffect, useState } from 'react';

function UsersPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('USER');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      // Get current user to find tenantId
      const meRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const meData = await meRes.json();
      const tenantId = meData.tenantId || meData.data?.tenantId;

      if (!tenantId) {
        setError('No tenantId found');
        setLoading(false);
        return;
      }

      // Fetch all tenant users
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load users');
      }

      const list = data?.data?.users || data?.data || [];
      setUsers(list);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      alert('Email, password, and name are required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      // Get tenantId
      const meRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const meData = await meRes.json();
      const tenantId = meData.tenantId || meData.data?.tenantId;

      // Create user
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to create user');
        return;
      }

      // Refresh list
      await loadUsers();

      // Reset form
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('USER');
      setShowAddUser(false);
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to delete user');
        return;
      }

      // Refresh list
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Users</h2>
        <div>
          <button onClick={() => setShowAddUser(true)} style={{ marginRight: 8 }}>
            + Add User
          </button>
          <button onClick={onBack}>Back</button>
        </div>
      </div>

      {showAddUser && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Add User</h3>
          <div style={{ marginBottom: 8 }}>
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Role: </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ padding: '6px' }}
            >
              <option value="USER">User</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
            </select>
          </div>
          <button onClick={handleAddUser} style={{ marginRight: 8 }}>
            Save
          </button>
          <button
            onClick={() => {
              setShowAddUser(false);
              setNewEmail('');
              setNewPassword('');
              setNewName('');
              setNewRole('USER');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <p>Total users: {users.length}</p>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{u.name}</td>
                <td style={{ padding: '8px' }}>{u.email}</td>
                <td style={{ padding: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: u.role === 'TENANT_ADMIN' ? '#d4edda' : '#f0f0f0',
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '8px' }}>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersPage;
