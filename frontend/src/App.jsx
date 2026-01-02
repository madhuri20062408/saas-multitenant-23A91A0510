// src/App.jsx
import React, { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import RegistrationPage from './RegistrationPage.jsx';
import ProjectsPage from './ProjectsPage.jsx';
import Dashboard from './Dashboard.jsx';
import UsersPage from './UsersPage.jsx';
import ProjectDetailsPage from './ProjectDetailsPage.jsx';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [subdomain, setSubdomain] = useState('acme');
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'projects' | 'users' | 'projectDetails' | 'login' | 'register'
  const [projectsCount, setProjectsCount] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleLoginSuccess = (usedSubdomain) => {
    setSubdomain(usedSubdomain);
    setLoggedIn(true);
    setView('dashboard');
  };

  const handleRegistrationSuccess = (newSubdomain) => {
    setSubdomain(newSubdomain);
    setView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    setView('login');
    setSelectedProject(null);
  };

  const handleProjectsLoaded = (count) => {
    setProjectsCount(count);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setView('projectDetails');
  };

  // If not logged in, show login or register
  if (!loggedIn) {
    if (view === 'register') {
      return (
        <RegistrationPage
          onRegistrationSuccess={handleRegistrationSuccess}
          onGoToLogin={() => setView('login')}
        />
      );
    }
    
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => setView('register')}
      />
    );
  }

  if (view === 'projects') {
    return (
      <ProjectsPage
        subdomain={subdomain}
        onLogout={handleLogout}
        onProjectsLoaded={handleProjectsLoaded}
        onProjectClick={handleProjectClick}
      />
    );
  }

  if (view === 'users') {
    return <UsersPage onBack={() => setView('dashboard')} />;
  }

  if (view === 'projectDetails') {
    return (
      <ProjectDetailsPage
        project={selectedProject}
        onBack={() => setView('projects')}
      />
    );
  }

  // default: dashboard
  return (
    <Dashboard
      subdomain={subdomain}
      projectsCount={projectsCount}
      onGoToProjects={() => setView('projects')}
      onGoToUsers={() => setView('users')}
      onLogout={handleLogout}
    />
  );
}

export default App;
