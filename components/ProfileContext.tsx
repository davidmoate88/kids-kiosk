"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getProfile, type Profile, type ProfileId } from "@/lib/profiles";

const STORAGE_KEY = "kk_profile";

type ProfileContextValue = {
  profile: Profile | null;
  ready: boolean;
  selectProfile: (id: ProfileId) => void;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ profile: Profile | null; ready: boolean }>({
    profile: null,
    ready: false,
  });
  const { profile, ready } = state;

  useEffect(() => {
    // Reading localStorage is only possible client-side, so profile
    // selection is hydrated once after mount rather than during render.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ profile: getProfile(stored), ready: true });
  }, []);

  function selectProfile(id: ProfileId) {
    window.localStorage.setItem(STORAGE_KEY, id);
    setState({ profile: getProfile(id), ready: true });
  }

  function clearProfile() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({ profile: null, ready: true });
  }

  return (
    <ProfileContext.Provider value={{ profile, ready, selectProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
