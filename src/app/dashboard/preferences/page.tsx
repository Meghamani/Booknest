export default function PreferencesPage() {
  return (
    <div className="mx-auto max-w-4xl text-textPrimary">
      <header className="mb-8 border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accentHover">Make it yours</p>
        <h1 className="text-2xl font-semibold">Preferences</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-textSecondary">
          A thoughtful reading life looks different for everyone. Your personal reading settings will live here.
        </p>
      </header>
      <section className="max-w-2xl border-l-2 border-secondaryAccent pl-5">
        <h2 className="font-serif text-xl">Your reading room, your rhythm.</h2>
        <p className="mt-2 text-sm leading-6 text-textSecondary">
          We are preparing a few ways to make your Book Hub feel more like your own.
        </p>
      </section>
    </div>
  );
}