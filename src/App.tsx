/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppProvider, useAppContext } from './store';
import Layout from './components/Layout';
import { ViewState } from './types';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Media from './pages/Media';
import Jurnal from './pages/Jurnal';
import Asisten from './pages/Asisten';
import Statistik from './pages/Statistik';
import Pengaturan from './pages/Pengaturan';
import Arsip from './pages/Arsip';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const ViewRenderer = () => {
  const { currentView } = useAppContext();
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'library': return <Library />;
      case 'media': return <Media />;
      case 'jurnal': return <Jurnal />;
      case 'asisten': return <Asisten />;
      case 'statistik': return <Statistik />;
      case 'pengaturan': return <Pengaturan />;
      case 'arsip': return <Arsip />;
      default: return <Dashboard />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full w-full"
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
}

const AppContent = () => {
  return (
    <Layout>
      <ViewRenderer />
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
