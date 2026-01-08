import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import TemplateEditor from '../components/Admin/TemplateEditor';
import LogoManager from '../components/Admin/LogoManager';
import MappingConfig from '../components/Admin/MappingConfig';
import SettingsPanel from '../components/Admin/SettingsPanel';

const Admin = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Administration</h1>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{user.email}</span>
            <button onClick={logout} style={styles.logoutButton}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <nav style={styles.sidebar}>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'templates' ? styles.navButtonActive : {}),
            }}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('logos')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'logos' ? styles.navButtonActive : {}),
            }}
          >
            Logos
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'mappings' ? styles.navButtonActive : {}),
            }}
          >
            Mappings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'settings' ? styles.navButtonActive : {}),
            }}
          >
            Paramètres
          </button>
          <a href="/" style={styles.homeLink}>
            ← Retour à l'accueil
          </a>
        </nav>

        <main style={styles.main}>
          {activeTab === 'templates' && <TemplateEditor />}
          {activeTab === 'logos' && <LogoManager />}
          {activeTab === 'mappings' && <MappingConfig />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userEmail: {
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 64px)',
  },
  sidebar: {
    width: '200px',
    backgroundColor: 'white',
    padding: '20px',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  navButton: {
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '5px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    transition: 'background-color 0.2s',
  },
  navButtonActive: {
    backgroundColor: '#e3f2fd',
    color: '#2196F3',
    fontWeight: 'bold',
  },
  homeLink: {
    display: 'block',
    marginTop: 'auto',
    padding: '12px 16px',
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    borderTop: '1px solid #ddd',
    paddingTop: '20px',
  },
  main: {
    flex: 1,
    backgroundColor: 'white',
    overflow: 'auto',
  },
};

export default Admin;
