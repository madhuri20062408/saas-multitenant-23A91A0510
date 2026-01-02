// src/Dashboard.jsx
import React from 'react';

function Dashboard({ subdomain, projectsCount, onGoToProjects, onGoToUsers, onLogout }) {
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Dashboard for {subdomain}</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0 }}>Total projects: {projectsCount}</p>
      </div>

      <button onClick={onGoToProjects} style={{ marginRight: 8 }}>
        Go to Projects
      </button>
      <button onClick={onGoToUsers}>
        Go to Users
      </button>
    </div>
  );
}

export default Dashboard;
