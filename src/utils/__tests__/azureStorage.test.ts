import test from 'node:test';
import assert from 'node:assert/strict';

// Helper mirror functions matching server-side validation logic
const ALLOWED_EXTENSIONS = new Set(['pdf', 'pptx', 'docx', 'mp4', 'webm', 'mp3', 'png', 'jpg', 'jpeg']);
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'image/png',
  'image/jpeg',
  'image/jpg'
]);
const MAX_RESOURCE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

function validateStorageUploadRequest(fileName: string, contentType: string, size: number) {
  const extParts = fileName.split('.');
  const ext = extParts.length > 1 ? extParts.pop()!.toLowerCase() : '';
  const cleanContentType = (contentType || '').toLowerCase().trim();

  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_CONTENT_TYPES.has(cleanContentType)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (size > MAX_RESOURCE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds maximum allowed cap of 500 MB' };
  }

  return { valid: true };
}

function buildAzureBlobStoragePath(orgId: string, courseId: string, moduleId: string, fileName: string) {
  const safeOrgId = (orgId || 'default-org').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCourseId = String(courseId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeModuleId = String(moduleId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeOrgId}/${safeCourseId}/${safeModuleId}/1700000000_${safeFileName}`;
}

function authorizeReadAccess(user: { uid: string; role: string; admin?: boolean }, resource: { courseId: string; uploadedBy: string }, userEnrollmentCourseIds: string[]) {
  if (user.role === 'admin' || user.admin === true) return true;
  if (resource.uploadedBy === user.uid) return true;
  if (userEnrollmentCourseIds.includes(resource.courseId)) return true;
  return false;
}

test('Azure Storage validation: accepts valid PDF, PPTX, MP4, PNG within 500MB', () => {
  assert.equal(validateStorageUploadRequest('syllabus.pdf', 'application/pdf', 1048576).valid, true);
  assert.equal(validateStorageUploadRequest('presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 5242880).valid, true);
  assert.equal(validateStorageUploadRequest('lecture.mp4', 'video/mp4', 104857600).valid, true);
  assert.equal(validateStorageUploadRequest('diagram.png', 'image/png', 524288).valid, true);
});

test('Azure Storage validation: rejects invalid extensions (exe, zip, sh) and oversized files', () => {
  assert.equal(validateStorageUploadRequest('malware.exe', 'application/x-msdownload', 1024).valid, false);
  assert.equal(validateStorageUploadRequest('archive.zip', 'application/zip', 1024).valid, false);
  assert.equal(validateStorageUploadRequest('huge_video.mp4', 'video/mp4', 600 * 1024 * 1024).valid, false);
});

test('Azure Storage path builder: constructs safe path orgId/courseId/moduleId/<safeName>', () => {
  const path = buildAzureBlobStoragePath('ACME Corp', 'CS 301!', 'module-1', 'lecture notes & slides.pdf');
  assert.equal(path, 'ACME_Corp/CS_301_/module-1/1700000000_lecture_notes___slides.pdf');
});

test('Azure Storage authorization: permits enrolled trainees, course uploader, and admins', () => {
  const adminUser = { uid: 'u-admin', role: 'admin', admin: true };
  const uploaderUser = { uid: 'u-trainer', role: 'trainer' };
  const enrolledTrainee = { uid: 'u-trainee-1', role: 'trainee' };
  const nonEnrolledTrainee = { uid: 'u-trainee-2', role: 'trainee' };

  const resource = { courseId: 'course-101', uploadedBy: 'u-trainer' };

  assert.equal(authorizeReadAccess(adminUser, resource, []), true);
  assert.equal(authorizeReadAccess(uploaderUser, resource, []), true);
  assert.equal(authorizeReadAccess(enrolledTrainee, resource, ['course-101']), true);
  assert.equal(authorizeReadAccess(nonEnrolledTrainee, resource, ['course-999']), false);
});
