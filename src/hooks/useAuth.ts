import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ id: number; email: string; gender: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          const res = await fetch(`/api/me/${parsedUser.id}`);
          if (res.ok) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error("Failed to verify user", error);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout, loading };
}
