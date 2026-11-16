import { Film, Clapperboard, Sparkles, Download } from 'lucide-react';
import type { Language, StudioStage } from '../types/studio';
import { COPY } from '../utils/i18n';

interface HeaderProps {
  language: Language;
  activeStage: StudioStage;
  onSelectStage: (stage: StudioStage) => void;
  onPrimaryAction: () => void;
  isExporting: boolean;
}

export function Header({
  language,
  activeStage,
  onSelectStage,
  onPrimaryAction,
  isExporting,
}: HeaderProps) {
  const t = COPY[language];

  const navItems: { id: StudioStage; label: string; icon: typeof Sparkles }[] = [
    { id: 'setup', label: t.navSetup, icon: Sparkles },
    { id: 'storyboard', label: t.navStoryboard, icon: Clapperboard },
    { id: 'production', label: t.navProduction, icon: Film },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D12]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectStage('setup')}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-orange-500 rounded-md"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-slate-950 font-extrabold">
            U
          </span>
          <span className="font-display">{t.brand}</span>
        </button>

        {/* Zone 2: Concise single-line navigation tabs */}
        <nav
          aria-label="Studio Workflow Stages"
          className="hidden md:flex items-center gap-6"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeStage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectStage(item.id)}
                className={`inline-flex items-center gap-2 py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-orange-500 ${
                  active
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>
              {activeStage === 'production' ? t.primaryExportBtn : t.primaryBuildBtn}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Stage Switcher */}
      <div className="flex md:hidden items-center justify-between overflow-x-auto border-t border-white/10 px-3 py-2 gap-1.5">
        {navItems.map((item) => {
          const active = activeStage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStage(item.id)}
              className={`px-2 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
