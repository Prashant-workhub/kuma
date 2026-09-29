export type PortalUserRole = 'student' | 'faculty' | 'admin';

export function portalRoleFromProfile(role: unknown): PortalUserRole | null {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (['faculty', 'teacher', 'trainer'].includes(normalized)) return 'faculty';
  if (['student', 'trainee'].includes(normalized)) return 'student';
  return null;
}