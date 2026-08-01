"use client";

import { useRouter } from "next/navigation";
import { PROFILES } from "@/lib/profiles";
import { useProfile } from "@/components/ProfileContext";

export default function ProfilePickerPage() {
  const router = useRouter();
  const { selectProfile } = useProfile();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-14 px-6 py-10 min-h-screen">
      <div className="text-center">
        <p className="text-6xl md:text-7xl mb-2">🌈</p>
        <h1 className="text-5xl md:text-6xl font-extrabold">Who&apos;s playing?</h1>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-10">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              selectProfile(p.id);
              router.push("/home");
            }}
            className="tap-pop flex flex-col items-center gap-4 rounded-[3rem] p-10 w-72 shadow-xl text-white"
            style={{
              background: `linear-gradient(160deg, ${p.color}, ${p.colorDark})`,
            }}
          >
            <span className="text-9xl md:text-[9rem] gentle-bob">{p.avatar}</span>
            <span className="text-4xl md:text-5xl font-extrabold">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
