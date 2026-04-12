import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';

export interface NotificationPreferences {
  entranceExams: boolean;
  results: boolean;
  counseling: boolean;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    entranceExams: false,
    results: false,
    counseling: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setPreferences(userDoc.data().notificationPreferences || preferences);
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const updatePreferences = async (newPrefs: NotificationPreferences) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await updateDoc(userRef, { notificationPreferences: newPrefs });
    } else {
      await setDoc(userRef, { uid: user.uid, email: user.email, notificationPreferences: newPrefs });
    }
    setPreferences(newPrefs);
  };

  return { preferences, updatePreferences, loading };
};
