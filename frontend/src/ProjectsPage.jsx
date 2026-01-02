// src/ProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import { getProjectsApi } from './api';

function ProjectsPage({ subdomain, onLogout, onProjectsLoaded, onProjectClick }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login again.');
      setLoading(false);
      return;
    }

    getProjectsApi({ token })
      .then((data) => {
        console.log('projects API response:', data);

        const list = data?.data?.projects || [];
        setProjects(list);

        if (onProjectsLoaded && Array.isArray(list)) {
          onProjectsLoaded(list.length);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, [subdomain, onProjectsLoaded]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) onLogout();
  };

  const handleCreateProject = async () => {
    if (!newName.trim()) {
      alert('Project name is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || 'Failed to create project';
        alert(msg);
        return;
      }

      const created = data?.data?.project || data?.data || data;

      setProjects((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = created ? [created, ...list] : list;
        if (onProjectsLoaded) {
          onProjectsLoaded(updated.length);
        }
        return updated;
      });

      setNewName('');
      setNewDescription('');
      setShowCreate(false);
    } catch (err) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || 'Failed to delete project';
        alert(msg);
        return;
      }

      setProjects((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list.filter((p) => p.id !== projectId);
        if (onProjectsLoaded) {
          onProjectsLoaded(updated.length);
        }
        return updated;
      });
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    }
  };

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const hasProjects = Array.isArray(projects) && projects.length > 0;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Projects for {subdomain}</h2>
        <div>
          <button onClick={() => setShowCreate(true)} style={{ marginRight: 8 }}>
            + New Project
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <p style={{ marginBottom: 12 }}>
        Total projects: {Array.isArray(projects) ? projects.length : 0}
      </p>

      {showCreate && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Create Project</h3>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ width: '100%', minHeight: 60 }}
            />
          </div>
          <button onClick={handleCreateProject} style={{ marginRight: 8 }}>
            Save
          </button>
          <button
            onClick={() => {
              setShowCreate(false);
              setNewName('');
              setNewDescription('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {!hasProjects ? (
        <p>No projects found.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <strong
                    onClick={() => onProjectClick && onProjectClick(p)}
                    style={{
                      cursor: 'pointer',
                      color: '#0066cc',
                      textDecoration: 'underline',
                    }}
                  >
                    {p.name}
                  </strong>
                  {p.description ? (
                    <div style={{ fontSize: '0.9rem', color: '#555' }}>
                      {p.description}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {p.status && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#eee',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p.status}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProjectsPage;
