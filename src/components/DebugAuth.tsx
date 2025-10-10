import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuth: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug Auth</h3>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User ID: {user?.id || 'null'}</div>
      <div>User Email: {user?.email || 'null'}</div>
      <div>Profile ID: {userProfile?.id || 'null'}</div>
      <div>Profile Name: {userProfile?.name || 'null'}</div>
      <div>Profile Role: {userProfile?.role || 'null'}</div>
    </div>
  );
};
