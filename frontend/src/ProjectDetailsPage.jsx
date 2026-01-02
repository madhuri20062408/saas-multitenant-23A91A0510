// src/ProjectDetailsPage.jsx
import React, { useEffect, useState } from 'react';

function ProjectDetailsPage({ project, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  useEffect(() => {
    if (!project || !project.id) {
      setError('No project selected');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login again.');
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/projects/${project.id}/tasks`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to load tasks');
        }
        const list = data?.data?.tasks || data?.data || (Array.isArray(data) ? data : []);
        setTasks(list);
      })
      .catch((err) => setError(err.message || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [project]);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      alert('Task title is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || 'Failed to create task';
        alert(msg);
        return;
      }

      const created = data?.data?.task || data?.data || data;

      setTasks((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return created ? [created, ...list] : list;
      });

      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setShowCreateTask(false);
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || 'Failed to update task status';
        alert(msg);
        return;
      }

      // Update task in local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update task status');
    }
  };

  if (!project) {
    return <p style={{ color: 'red' }}>No project selected</p>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack}>← Back to Projects</button>
      </div>

      <h2>{project.name}</h2>
      {project.description && (
        <p style={{ color: '#555', marginBottom: 16 }}>{project.description}</p>
      )}
      {project.status && (
        <p style={{ marginBottom: 16 }}>
          Status:{' '}
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#eee',
              textTransform: 'capitalize',
            }}
          >
            {project.status}
          </span>
        </p>
      )}

      <hr style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3>Tasks</h3>
        <button onClick={() => setShowCreateTask(true)}>+ New Task</button>
      </div>

      {showCreateTask && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h4 style={{ marginTop: 0 }}>Create Task</h4>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
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
          <div style={{ marginBottom: 8 }}>
            <label>Priority: </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button onClick={handleCreateTask} style={{ marginRight: 8 }}>
            Save
          </button>
          <button
            onClick={() => {
              setShowCreateTask(false);
              setNewTitle('');
              setNewDescription('');
              setNewPriority('medium');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading tasks...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((t) => (
            <li
              key={t.id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{t.title}</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.priority && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          t.priority === 'high'
                            ? '#ffcccc'
                            : t.priority === 'medium'
                            ? '#fff3cd'
                            : '#d1ecf1',
                      }}
                    >
                      {t.priority}
                    </span>
                  )}
                </div>
              </div>

              {t.description && (
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 8 }}>
                  {t.description}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '0.85rem' }}>Status:</label>
                <select
                  value={t.status || 'todo'}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '2px 6px' }}
                >
                  <option value="todo">Todo</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProjectDetailsPage;
