const API_URL = 'http://localhost:5000';

export async function loginApi({ email, password, subdomain }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, subdomain }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data; // { token, user, ... }
}

export async function getProjectsApi({ subdomain, token }) {
  const res = await fetch(
    `${API_URL}/api/projects?subdomain=${encodeURIComponent(subdomain)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch projects');
  }

  return res.json(); 
}
