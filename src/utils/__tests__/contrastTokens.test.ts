import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '').trim();
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const sRGB = [r, g, b].map(v => {
    const val = v / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design Tokens — WCAG AA Contrast Verification', () => {
  const lightTokens = {
    page: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F4',
    textPrimary: '#151A22',
    textSecondary: '#4A5462',
    textTertiary: '#5F6B7C',
    primary: '#1F4FD8',
    primarySubtle: '#EFF3FE',
    textPrimarySubtle: '#1338A0',
    success: '#1E7A4C',
    successSubtle: '#EBF7F0',
    textSuccessSubtle: '#145333',
    warning: '#A15C07',
    warningSubtle: '#FEF7EC',
    textWarningSubtle: '#734103',
    danger: '#B4232C',
    dangerSubtle: '#FDF2F2',
    textDangerSubtle: '#82151B',
    info: '#0F6C8C',
    infoSubtle: '#F0F9FC',
    textInfoSubtle: '#0A485E',
  };

  const darkTokens = {
    page: '#0F1319',
    surface: '#171C24',
    surfaceMuted: '#1E2430',
    textPrimary: '#E7EAF0',
    textSecondary: '#AAB3C2',
    textTertiary: '#8892A3',
    primary: '#6D93F5',
    primarySubtle: '#192542',
    textPrimarySubtle: '#9DB8FF',
    success: '#42BD79',
    successSubtle: '#132E20',
    textSuccessSubtle: '#5FD695',
    warning: '#F59E0B',
    warningSubtle: '#332308',
    textWarningSubtle: '#FBBF24',
    danger: '#F87171',
    dangerSubtle: '#38161A',
    textDangerSubtle: '#FCA5A5',
    info: '#38BDF8',
    infoSubtle: '#102A36',
    textInfoSubtle: '#7DD3FC',
  };

  test('Light theme text/background pairs meet >= 4.5:1 contrast ratio', () => {
    const pairs = [
      { text: lightTokens.textPrimary, bg: lightTokens.surface, name: 'Primary Text on Surface' },
      { text: lightTokens.textPrimary, bg: lightTokens.page, name: 'Primary Text on Page' },
      { text: lightTokens.textSecondary, bg: lightTokens.surface, name: 'Secondary Text on Surface' },
      { text: lightTokens.textSecondary, bg: lightTokens.page, name: 'Secondary Text on Page' },
      { text: lightTokens.textTertiary, bg: lightTokens.surface, name: 'Tertiary Text on Surface' },
      { text: lightTokens.primary, bg: lightTokens.surface, name: 'Primary Color on Surface' },
      { text: lightTokens.textPrimarySubtle, bg: lightTokens.primarySubtle, name: 'Subtle Primary Text on Subtle Primary BG' },
      { text: lightTokens.success, bg: lightTokens.surface, name: 'Success Color on Surface' },
      { text: lightTokens.textSuccessSubtle, bg: lightTokens.successSubtle, name: 'Subtle Success Text on Subtle Success BG' },
      { text: lightTokens.warning, bg: lightTokens.surface, name: 'Warning Color on Surface' },
      { text: lightTokens.textWarningSubtle, bg: lightTokens.warningSubtle, name: 'Subtle Warning Text on Subtle Warning BG' },
      { text: lightTokens.danger, bg: lightTokens.surface, name: 'Danger Color on Surface' },
      { text: lightTokens.textDangerSubtle, bg: lightTokens.dangerSubtle, name: 'Subtle Danger Text on Subtle Danger BG' },
      { text: lightTokens.info, bg: lightTokens.surface, name: 'Info Color on Surface' },
      { text: lightTokens.textInfoSubtle, bg: lightTokens.infoSubtle, name: 'Subtle Info Text on Subtle Info BG' },
    ];

    pairs.forEach(({ text, bg, name }) => {
      const ratio = getContrastRatio(text, bg);
      assert.ok(ratio >= 4.5, `${name} contrast ratio ${ratio.toFixed(2)}:1 is below 4.5:1 threshold`);
    });
  });

  test('Dark theme text/background pairs meet >= 4.5:1 contrast ratio', () => {
    const pairs = [
      { text: darkTokens.textPrimary, bg: darkTokens.surface, name: 'Primary Text on Surface' },
      { text: darkTokens.textPrimary, bg: darkTokens.page, name: 'Primary Text on Page' },
      { text: darkTokens.textSecondary, bg: darkTokens.surface, name: 'Secondary Text on Surface' },
      { text: darkTokens.textSecondary, bg: darkTokens.page, name: 'Secondary Text on Page' },
      { text: darkTokens.textTertiary, bg: darkTokens.surface, name: 'Tertiary Text on Surface' },
      { text: darkTokens.primary, bg: darkTokens.surface, name: 'Primary Color on Surface' },
      { text: darkTokens.textPrimarySubtle, bg: darkTokens.primarySubtle, name: 'Subtle Primary Text on Subtle Primary BG' },
      { text: darkTokens.success, bg: darkTokens.surface, name: 'Success Color on Surface' },
      { text: darkTokens.textSuccessSubtle, bg: darkTokens.successSubtle, name: 'Subtle Success Text on Subtle Success BG' },
      { text: darkTokens.warning, bg: darkTokens.surface, name: 'Warning Color on Surface' },
      { text: darkTokens.textWarningSubtle, bg: darkTokens.warningSubtle, name: 'Subtle Warning Text on Subtle Warning BG' },
      { text: darkTokens.danger, bg: darkTokens.surface, name: 'Danger Color on Surface' },
      { text: darkTokens.textDangerSubtle, bg: darkTokens.dangerSubtle, name: 'Subtle Danger Text on Subtle Danger BG' },
      { text: darkTokens.info, bg: darkTokens.surface, name: 'Info Color on Surface' },
      { text: darkTokens.textInfoSubtle, bg: darkTokens.infoSubtle, name: 'Subtle Info Text on Subtle Info BG' },
    ];

    pairs.forEach(({ text, bg, name }) => {
      const ratio = getContrastRatio(text, bg);
      assert.ok(ratio >= 4.5, `${name} contrast ratio ${ratio.toFixed(2)}:1 is below 4.5:1 threshold`);
    });
  });
});
