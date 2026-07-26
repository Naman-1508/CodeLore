import { useUser, useClerk } from '@clerk/clerk-react';
import { User, Mail, LogOut, Loader2, Shield } from 'lucide-react';

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-full">
      <h1 className="text-3xl font-bold text-slate-50 mb-8 tracking-tight">Account Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Actions */}
        <div className="col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/10 bg-midnight-100 flex items-center justify-center shadow-sm">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-500" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{user.fullName || 'Developer'}</h2>
            <p className="text-slate-500 text-sm mb-6">{user.primaryEmailAddress?.emailAddress}</p>
            
            <button 
              onClick={() => signOut({ redirectUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 py-2 px-4 rounded-lg transition-colors font-medium text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm border border-white/10">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <User size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user.firstName || ''} 
                    className="w-full bg-midnight-100 border border-white/10 text-slate-300 px-4 py-2.5 rounded-lg font-mono text-sm opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user.lastName || ''} 
                    className="w-full bg-midnight-100 border border-white/10 text-slate-300 px-4 py-2.5 rounded-lg font-mono text-sm opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} /> Email Addresses
                </label>
                <div className="w-full bg-midnight-100 border border-white/10 text-slate-300 px-4 py-3 rounded-lg font-mono text-sm flex flex-col gap-2 shadow-sm">
                  {user.emailAddresses.map((email) => (
                    <div key={email.id} className="flex items-center justify-between">
                      <span>{email.emailAddress}</span>
                      {email.id === user.primaryEmailAddressId && (
                        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-sans font-semibold">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="glass-panel border border-white/10 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Security & Authentication
            </h3>
            
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              You are using Clerk Headless UI. To manage advanced security settings like multi-factor authentication or connected OAuth accounts, use the Clerk Dashboard during this development phase.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
