import fs from 'fs';
import path from 'path';

interface GuardrailViolation {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

const VIOLATIONS: GuardrailViolation[] = [];

// Paths subject to strict UI guardrail rules
const TARGET_PATHS = [
  'src/components/ui',
  'src/components/layout',
  'src/admin/AdminPortalApp.tsx',
  'src/admin/AdminOverviewView.tsx',
  'src/admin/AdminUsersView.tsx',
  'src/admin/AdminOrganizationView.tsx',
  'src/admin/AdminCompetenciesView.tsx',
  'src/components/AuthView.tsx',
  'src/components/DashboardView.tsx',
  'src/components/ProfileView.tsx',
  'src/components/SkillGapView.tsx',
  'src/components/CertificatesView.tsx',
  'src/components/SettingsView.tsx',
  'src/components/FindTrainerDiscoveryView.tsx',
  'src/App.tsx',
];

function shouldScan(filePath: string): boolean {
  const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  if (relative.includes('/__tests__/')) return false;
  return TARGET_PATHS.some((tp) => relative === tp || relative.startsWith(tp + '/'));
}

function scanFile(filePath: string) {
  if (!shouldScan(filePath)) return;

  const ext = path.extname(filePath);
  if (!['.ts', '.tsx'].includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  lines.forEach((lineText, index) => {
    const lineNum = index + 1;
    const trimmed = lineText.trim();

    // Skip comments or explicit guardrail overrides
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || lineText.includes('guardrail-ignore')) {
      return;
    }

    // Rule 1: Raw Hex/RGB colors in TSX UI code
    const hexMatch = lineText.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g);
    if (hexMatch) {
      if (
        !lineText.includes('<path') &&
        !lineText.includes('viewBox') &&
        !lineText.includes('xmlns') &&
        !lineText.includes('fill=') &&
        !lineText.includes('stroke=') &&
        !lineText.includes('Assessment #') &&
        !lineText.includes('Ticket #')
      ) {
        VIOLATIONS.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_RAW_HEX_COLOR',
          snippet: `Found raw hex color (${hexMatch.join(', ')}) instead of CSS design tokens.`,
        });
      }
    }

    // Rule 2: Inline style={{...}} for non-dynamic visual styling
    if (ext === '.tsx') {
      if (lineText.includes('style={{')) {
        const isDynamicAllowed =
          lineText.includes('style={{ width:') ||
          lineText.includes('style={{ height:') ||
          lineText.includes('style={{ transform:') ||
          lineText.includes('style={{ animation') ||
          lineText.includes('style={{ display');
        if (!isDynamicAllowed) {
          VIOLATIONS.push({
            file: relativePath,
            line: lineNum,
            rule: 'NO_INLINE_STYLE_PROP',
            snippet: `Found style={{...}} prop. Use Tailwind tokens or CSS variables instead.`,
          });
        }
      }
    }

    // Rule 3: Arbitrary Tailwind bracket values ([#...], [123px])
    if (ext === '.tsx') {
      const arbitraryTailwind = lineText.match(/\b(bg|text|border|w|h|p|m|max-w)-\[[^\]]+\]/g);
      if (arbitraryTailwind) {
        const badArbitrary = arbitraryTailwind.filter(
          (cls) => cls.includes('#') || cls.includes('px')
        );
        if (badArbitrary.length > 0) {
          VIOLATIONS.push({
            file: relativePath,
            line: lineNum,
            rule: 'NO_ARBITRARY_TAILWIND_VALUES',
            snippet: `Found arbitrary Tailwind values (${badArbitrary.join(', ')}). Use design system tokens.`,
          });
        }
      }
    }

    // Rule 4: Direct imports of Chart library outside src/components/charts
    if (lineText.includes("from 'recharts'") || lineText.includes('from "recharts"') || lineText.includes("from 'chart.js'")) {
      if (!relativePath.startsWith('src/components/charts/')) {
        VIOLATIONS.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_DIRECT_CHART_IMPORT',
          snippet: `Direct import of chart library outside src/components/charts. Use ChartCard or BarChart wrappers instead.`,
        });
      }
    }

    // Rule 5: System text emojis in TSX UI files
    if (ext === '.tsx') {
      const emojiMatch = lineText.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
      if (emojiMatch && !lineText.includes('// emoji-ok')) {
        VIOLATIONS.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_EMOJI_IN_SYSTEM_TEXT',
          snippet: `Found emoji character (${emojiMatch[0]}) in system UI string. Use Lucide icons instead.`,
        });
      }
    }
  });
}

function walkDir(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Running UI Guardrail & Design Token Verification...');
walkDir(path.resolve(process.cwd(), 'src'));

if (VIOLATIONS.length > 0) {
  console.error('\n❌ UI Guardrail Violations Found:\n');
  VIOLATIONS.forEach((v) => {
    console.error(`  [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ↳ ${v.snippet}\n`);
  });
  console.error(`Total violations: ${VIOLATIONS.length}`);
  process.exit(1);
} else {
  console.log('✅ UI Guardrails Check Passed: 0 design token or copy violations found.');
  process.exit(0);
}
