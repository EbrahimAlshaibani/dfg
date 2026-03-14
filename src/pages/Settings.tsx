import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Settings Navigation */}
          <div className="md:col-span-1 p-6 bg-slate-50">
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-indigo-700 shadow-sm border border-slate-200">
                <User className="w-4 h-4" />
                Profile
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
                Notifications
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <Shield className="w-4 h-4" />
                Security
              </a>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 p-6 sm:p-8 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-sm"
                />
                <div>
                  <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                    Change Avatar
                  </button>
                  <p className="mt-2 text-xs text-slate-500">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <form className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.displayName || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    defaultValue={user?.email || ''}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg shadow-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">Email addresses are managed through your Google account.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input
                    type="text"
                    disabled
                    defaultValue={user?.role || 'user'}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg shadow-sm capitalize"
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
