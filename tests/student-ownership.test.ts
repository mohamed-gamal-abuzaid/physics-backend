import { describe, expect, it } from 'vitest';
import { canAccessAssignment } from '../src/modules/student/student.service.js';

describe('student assignment ownership', () => {
  it('allows the direct student owner', () => {
    expect(canAccessAssignment({ studentId: 10, assignedStudentIds: null }, 10)).toBe(true);
  });

  it('allows a student listed in assignedStudentIds', () => {
    expect(canAccessAssignment({ studentId: null, assignedStudentIds: [10, 11] }, 11)).toBe(true);
  });

  it('rejects another student', () => {
    expect(canAccessAssignment({ studentId: 10, assignedStudentIds: [11] }, 12)).toBe(false);
  });

  it('rejects malformed assignment lists', () => {
    expect(canAccessAssignment({ studentId: null, assignedStudentIds: '10' }, 10)).toBe(false);
  });
});