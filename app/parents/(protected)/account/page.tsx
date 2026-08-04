import AccountClient from "./AccountClient";

export default function AccountPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Account</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Manage your parent login.
        </p>
      </div>
      <AccountClient />
    </div>
  );
}
