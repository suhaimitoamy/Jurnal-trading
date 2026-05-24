import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Menu, Library, Play, BookOpen, Bot, LayoutDashboard, BarChart2, HardDriveDownload, Settings, Archive, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { currentView, setCurrentView } = useAppContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'media', icon: Play, label: 'Media' },
    { id: 'jurnal', icon: BookOpen, label: 'Jurnal' },
    { id: 'asisten', icon: Bot, label: 'Asisten' }
  ] as const;

  const drawerItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'statistik', icon: BarChart2, label: 'Statistik' },
    { id: 'arsip', icon: Archive, label: 'Arsip' },
    { id: 'pengaturan', icon: Settings, label: 'Pengaturan' },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-[#E0E0E0] overflow-hidden font-sans select-none relative">
      
      {/* Decorative gradient glowing orb for glass effect */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00FF41]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00FF41]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="h-14 w-full bg-[#0A0A0A]/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors text-[#888] hover:text-[#00FF41]">
            <Menu size={24} />
          </button>
          <div className="font-semibold text-sm tracking-widest text-white uppercase flex items-center gap-3">
            <div className="w-8 h-8 border border-[#00FF41]/50 bg-[#00FF41]/10 rounded flex items-center justify-center shadow-[0_0_10px_rgba(0,255,65,0.2)]">
              <span className="text-[#00FF41] font-bold text-xs">TLM</span>
            </div>
            <span>Trading Library <span className="text-[#00FF41]">Manager</span></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative z-10 pb-16 scroll-smooth">
        <div className="h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 w-full fixed bottom-0 left-0 bg-[#0A0A0A]/60 backdrop-blur-md border-t border-white/5 flex justify-around items-center z-20 safe-area-bottom pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative group",
                isActive ? "text-[#00FF41]" : "text-[#555] hover:text-[#888]"
              )}
            >
              <item.icon size={22} className={cn(isActive && "animate-pulse drop-shadow-[0_0_8px_rgba(0,255,65,0.5)] transition-all")} />
              <span className="text-[10px] font-medium tracking-widest uppercase">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="w-8 h-0.5 bg-[#00FF41] rounded-full absolute top-0 shadow-[0_0_5px_rgba(0,255,65,0.8)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 bg-[#0A0A0A]/80 backdrop-blur-lg border-r border-white/5 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#00FF41]/50 font-bold">Menu Tambahan</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-md text-[#555] hover:bg-white/5 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {drawerItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                        setCurrentView(item.id as any);
                        setDrawerOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-6 py-4 text-left transition-colors text-sm relative group",
                      currentView === item.id ? "text-white" : "text-[#888] hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {currentView === item.id && (
                       <motion.div 
                          layoutId="drawer-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-[#00FF41] rounded-r-full shadow-[0_0_10px_rgba(0,255,65,0.5)]" 
                       />
                    )}
                    <item.icon size={20} className={currentView === item.id ? "text-[#00FF41]" : ""} />
                    <span className="font-medium tracking-wide">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
