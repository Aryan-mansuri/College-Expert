import React from 'react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { useAuth } from './AuthProvider';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences, loading } = useNotificationPreferences();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="mb-2">Sign in to manage notifications.</p>
        <button onClick={handleLogin} className="px-4 py-2 bg-blue-600 text-white rounded">Sign in with Google</button>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
      {Object.entries(preferences).map(([key, value]) => (
        <label key={key} className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={value}
            onChange={() => updatePreferences({ ...preferences, [key]: !value })}
            className="mr-2"
          />
          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
        </label>
      ))}
    </div>
  );
};
