// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
