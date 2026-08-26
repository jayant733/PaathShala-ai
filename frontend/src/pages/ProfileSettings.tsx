import { useAuthStore } from '../store/authStore';

export default function ProfileSettings() {
  const { user } = useAuthStore();
  const name = user?.email?.split('@')[0] || 'Learner';

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto p-spacing-gutter md:p-margin-desktop gap-spacing-gutter">
      <header className="flex flex-col gap-unit mb-8 w-full max-w-4xl">
        <h1 className="font-display-lg text-[48px] md:text-[64px] font-black text-ink-black tracking-tight leading-tight uppercase">
          Profile Settings
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl font-bold">
          Manage your account details.
        </p>
      </header>

      <div className="bg-surface-container-high border-4 border-surface-border p-8 md:p-12 shadow-[8px_8px_0_0_#111827] max-w-2xl">
        <div className="flex items-center gap-6 mb-10 border-b-4 border-surface-border pb-8">
          <div className="w-24 h-24 bg-primary border-4 border-surface-border flex items-center justify-center shadow-[4px_4px_0_0_#111827]">
            <span className="font-display-lg text-[40px] text-on-primary font-black uppercase">{name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="font-headline-lg text-[32px] font-black text-ink-black uppercase">{name}</h2>
            <p className="font-body-md text-on-surface-variant font-bold uppercase tracking-wider">Pro Learner</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label className="font-label-caps text-label-caps text-ink-black uppercase tracking-widest font-bold">Full Name</label>
            <div className="bg-surface border-4 border-surface-border p-4 font-body-lg text-ink-black font-bold shadow-[4px_4px_0_0_#111827]">
              {name}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="font-label-caps text-label-caps text-ink-black uppercase tracking-widest font-bold">Email Address</label>
            <div className="bg-surface border-4 border-surface-border p-4 font-body-lg text-ink-black font-bold shadow-[4px_4px_0_0_#111827]">
              {user?.email || 'No email provided'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
