import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_TO_PATH_MAP } from '../../routes';
import { TRAINEE_NAV_CONFIG, TRAINER_NAV_CONFIG, ADMIN_NAV_CONFIG } from '../../components/layout/navConfigs';

const itemIds = (config: typeof TRAINEE_NAV_CONFIG) => config.flatMap((group) => group.items.map((item) => item.id));

test('trainee sidebar entries all resolve to registered application routes', () => {
  for (const id of itemIds(TRAINEE_NAV_CONFIG)) {
    assert.ok(id in PAGE_TO_PATH_MAP, `Missing route for trainee sidebar item: ${id}`);
  }
});

test('admin sidebar entries all resolve to registered application routes', () => {
  for (const id of itemIds(ADMIN_NAV_CONFIG)) {
    assert.ok(id in PAGE_TO_PATH_MAP, `Missing route for admin sidebar item: ${id}`);
  }
});

test('trainer sidebar entries map one-to-one to trainer views', () => {
  const trainerViews = new Set(['overview', 'my-trainees', 'courses', 'progress', 'doubts', 'quizzes', 'analytics', 'insights', 'announcements', 'activity', 'settings']);
  const ids = itemIds(TRAINER_NAV_CONFIG);
  assert.equal(new Set(ids).size, ids.length, 'Trainer sidebar has duplicate destinations');
  for (const id of ids) assert.ok(trainerViews.has(id), `Missing trainer view for sidebar item: ${id}`);
});
