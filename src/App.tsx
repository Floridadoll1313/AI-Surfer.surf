/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { WebBuilds } from './pages/WebBuilds';
import { GameBuilds } from './pages/GameBuilds';
import { Workflows } from './pages/Workflows';
import { Automations } from './pages/Automations';
import { Vault } from './pages/Vault';
import { Memorial } from './pages/Memorial';
import { MemberChat } from './pages/MemberChat';
import { ModuleLibrary } from './pages/ModuleLibrary';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider } from './components/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rodanthe" element={<WebBuilds />} />
          <Route path="/avon" element={<GameBuilds />} />
          <Route path="/buxton" element={<Workflows />} />
          <Route path="/frisco" element={<Automations />} />
          <Route path="/hatteras" element={<Vault />} />
          <Route path="/memorial" element={<Memorial />} />
          <Route path="/chat" element={<MemberChat />} />
          <Route path="/academy" element={<ModuleLibrary />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  </AuthProvider>
  );
}
