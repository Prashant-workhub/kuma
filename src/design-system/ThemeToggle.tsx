import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/theme'
import { cn } from './cn'

/**
 * The one theme control in the product.
 *
 * Every portal used to hand-roll its own version (Trainer in `TopBar`, Trainee
 * in `Navbar`, Admin had none, Login had none). They all toggle the same
 * persisted state, so they are consolidated here and the appearance is
 * identical everywhere. It reads from tokens, so it needs no `theme` prop and
 * cannot drift out of sync with the provider.
 */
export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string
  /** Renders the target theme as text — used where there is room for it. */
  showLabel?: boolean
}) {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${next} theme`}
      aria-label={`Switch to ${next} theme`}
      className={cn(
        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-ink',
        showLabel && 'w-auto gap-2 px-3',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-brand-gold" />
      ) : (
        <Moon className="h-4 w-4 text-brand-cyan" />
      )}
      {showLabel && (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
          {next}
        </span>
      )}
    </button>
  )
}
