import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Heart, 
  Database, 
  Shield, 
  ArrowRight, 
  Zap, 
  Sparkles,
  User,
  Settings,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    messages: 0,
    stories: 0,
    vaultItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        // Ensure public profile exists for directory
        const publicRef = doc(db, 'users_public', user.uid);
        const publicSnap = await getDoc(publicRef);
        if (!publicSnap.exists()) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            await setDoc(publicRef, {
              uid: user.uid,
              displayName: data.displayName || user.displayName,
              photoURL: data.photoURL || user.photoURL,
              bio: data.bio || '',
              location: data.location || '',
            });
          }
        }

        // Fetch user's chat messages count
        const qChat = query(collection(db, 'chat_messages'), where('user_id', '==', user.uid));
        const chatSnap = await getDocs(qChat);
        
        // Fetch user's stories count (assuming we add author_id later, for now just total)
        const qStories = query(collection(db, 'memorial_stories'), limit(100));
        const storiesSnap = await getDocs(qStories);

        setStats({
          messages: chatSnap.size,
          stories: storiesSnap.size,
          vaultItems: 0 // Placeholder
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return null;

  const quickLinks = [
    { name: 'Neural Identity', path: '/profile', icon: User, color: 'text-neon-cyan' },
    { name: 'Member Chat', path: '/chat', icon: MessageSquare, color: 'text-neon-green' },
    { name: 'Member Directory', path: '/directory', icon: Sparkles, color: 'text-neon-yellow' },
    { name: 'Supabase Vault', path: '/supabase-vault', icon: Database, color: 'text-neon-purple' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="text-neon-cyan" size={40} />
            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Member Dashboard</h1>
          </div>
          {isAdmin && (
            <Link 
              to="/admin"
              className="px-6 py-2 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all"
            >
              Admin Access
            </Link>
          )}
        </div>
        <p className="text-slate-400 text-xl font-light tracking-wide">
          Welcome back, <span className="text-white font-bold">{user.displayName}</span>. Your neural nodes are synchronized.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 blur-2xl group-hover:bg-neon-cyan/10 transition-colors" />
          <div className="relative z-10">
            <MessageSquare className="text-neon-cyan mb-4" size={24} />
            <div className="text-4xl font-black mb-1">{stats.messages}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Messages Sent</div>
          </div>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-pink/5 blur-2xl group-hover:bg-neon-pink/10 transition-colors" />
          <div className="relative z-10">
            <Heart className="text-neon-pink mb-4" size={24} />
            <div className="text-4xl font-black mb-1">{stats.stories}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sanctuary Stories</div>
          </div>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 blur-2xl group-hover:bg-neon-purple/10 transition-colors" />
          <div className="relative z-10">
            <Activity className="text-neon-purple mb-4" size={24} />
            <div className="text-4xl font-black mb-1">Active</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Status</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 px-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                className="group flex items-center gap-4 p-6 glass-card rounded-2xl border border-white/5 hover:border-white/20 transition-all"
              >
                <div className={`p-3 bg-black/50 rounded-xl ${link.color} group-hover:scale-110 transition-transform`}>
                  <link.icon size={20} />
                </div>
                <span className="font-bold text-sm text-slate-300 group-hover:text-white transition-colors">{link.name}</span>
                <ArrowRight className="ml-auto text-slate-600 group-hover:text-neon-cyan opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 px-4">Recent Activity</h3>
          <div className="glass-card p-8 rounded-3xl border border-white/10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-neon-cyan/10 rounded-lg">
                  <Zap className="text-neon-cyan" size={16} />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Neural Identity Synchronized</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Just Now</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-neon-green/10 rounded-lg">
                  <Sparkles className="text-neon-green" size={16} />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Member Directory Scanned</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-neon-purple/10 rounded-lg">
                  <Database className="text-neon-purple" size={16} />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Supabase Vault Accessed</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Yesterday</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
