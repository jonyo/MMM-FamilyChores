import { describe, expect, it, vi } from 'vitest';
import { SocketNotifications } from '../constants/socket-notifications';
import {
  ChoreType,
  DayOfWeek,
  type FamilyChoresData,
  type RotatingChore,
  SkipDayVisibility,
} from '../types/chore-types';
import { getLocalDateString } from '../utils/date';
import { generateTestUUID } from '../utils/uuid';
import { type AdminHandlerContext, createAdminHandlers } from './admin-routes';

vi.mock('logger', () => ({
  info: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

// Stable test IDs
const pid1 = generateTestUUID(201);
const pid2 = generateTestUUID(202);
const cid1 = generateTestUUID(301);
const cid2 = generateTestUUID(302);

function createMockRes() {
  let statusCode = 200;
  let jsonBody: unknown;
  let sentBody: unknown;
  const headers: Record<string, string> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      jsonBody = data;
      return res;
    },
    send(data: unknown) {
      sentBody = data;
      return res;
    },
    sendFile(_path: string) {},
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    get sentBody() {
      return sentBody;
    },
    get headers() {
      return headers;
    },
  };
  return res;
}

function makeBaseData(): FamilyChoresData {
  return {
    people: [
      { id: pid1, name: 'Person 1', color: '#FF6B6B' },
      { id: pid2, name: 'Person 2', color: '#4ECDC4' },
    ],
    chores: [
      {
        id: cid1,
        name: 'Personal Chore',
        type: ChoreType.PERSONAL,
        assignedTo: pid1,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      },
      {
        id: cid2,
        name: 'Rotating Chore',
        type: ChoreType.ROTATING,
        rotation: [pid1, pid2],
        rotatingIndex: 0,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: false,
        completedToday: false,
      },
    ],
    lastResetDate: getLocalDateString(),
  };
}

function makeContext(data: FamilyChoresData | null = makeBaseData()): {
  context: AdminHandlerContext;
  mockSave: ReturnType<typeof vi.fn>;
  mockNotify: ReturnType<typeof vi.fn>;
  getData: () => FamilyChoresData | null;
} {
  let choreData = data;
  const mockSave = vi.fn();
  const mockNotify = vi.fn();

  const context: AdminHandlerContext = {
    getChoreData: () => choreData,
    setChoreData: (d) => {
      choreData = d;
    },
    saveChoreData: mockSave,
    sendNotification: mockNotify,
  };

  return { context, mockSave, mockNotify, getData: () => choreData };
}

describe('createAdminHandlers', () => {
  describe('getData', () => {
    it('returns chore data with 200', () => {
      const { context } = makeContext();
      const { getData } = createAdminHandlers(context);
      const res = createMockRes();
      getData({ body: undefined, params: {} }, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonBody).toMatchObject({ people: expect.any(Array), chores: expect.any(Array) });
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { getData } = createAdminHandlers(context);
      const res = createMockRes();
      getData({ body: undefined, params: {} }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('postPerson', () => {
    it('adds a valid person and saves', () => {
      const { context, mockSave, mockNotify, getData } = makeContext();
      const { postPerson } = createAdminHandlers(context);
      const res = createMockRes();
      postPerson({ body: { name: 'Alice', color: '#aabbcc' }, params: {} }, res);
      expect(res.statusCode).toBe(200);
      expect(getData()?.people).toHaveLength(3);
      expect(mockSave).toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith(SocketNotifications.CHORE_DATA, expect.anything());
    });

    it('returns 400 when name is blank', () => {
      const { context, mockSave } = makeContext();
      const { postPerson } = createAdminHandlers(context);
      const res = createMockRes();
      postPerson({ body: { name: '  ', color: '#fff' }, params: {} }, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toMatchObject({ error: expect.any(String) });
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when color is not hex', () => {
      const { context, mockSave } = makeContext();
      const { postPerson } = createAdminHandlers(context);
      const res = createMockRes();
      postPerson({ body: { name: 'Valid', color: 'not-hex' }, params: {} }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { postPerson } = createAdminHandlers(context);
      const res = createMockRes();
      postPerson({ body: { name: 'X', color: '#abc' }, params: {} }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('putPerson', () => {
    it('updates an existing person', () => {
      const { context, mockSave, getData } = makeContext();
      const { putPerson } = createAdminHandlers(context);
      const res = createMockRes();
      putPerson({ body: { name: 'Updated', color: '#aabbcc' }, params: { id: pid1 } }, res);
      expect(res.statusCode).toBe(200);
      expect(getData()?.people.find((p) => p.id === pid1)?.name).toBe('Updated');
      expect(mockSave).toHaveBeenCalled();
    });

    it('returns 404 when person not found', () => {
      const { context, mockSave } = makeContext();
      const { putPerson } = createAdminHandlers(context);
      const res = createMockRes();
      putPerson({ body: { name: 'X', color: '#abc' }, params: { id: generateTestUUID(999) } }, res);
      expect(res.statusCode).toBe(404);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when updated data fails validation', () => {
      const { context, mockSave } = makeContext();
      const { putPerson } = createAdminHandlers(context);
      const res = createMockRes();
      putPerson({ body: { name: 'Ok', color: '#gggggg' }, params: { id: pid1 } }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { putPerson } = createAdminHandlers(context);
      const res = createMockRes();
      putPerson({ body: { name: 'X', color: '#abc' }, params: { id: pid1 } }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('deletePerson', () => {
    it('removes the person and their personal chores', () => {
      const { context, mockSave, getData } = makeContext();
      const { deletePerson } = createAdminHandlers(context);
      const res = createMockRes();
      deletePerson({ body: undefined, params: { id: pid1 } }, res);
      expect(res.statusCode).toBe(200);
      expect(getData()?.people.find((p) => p.id === pid1)).toBeUndefined();
      // cid1 is personal chore assigned to pid1 — should be removed
      expect(getData()?.chores.find((c) => c.id === cid1)).toBeUndefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('removes person from rotating chores and keeps chore when rotation not empty', () => {
      const { context, getData } = makeContext();
      const { deletePerson } = createAdminHandlers(context);
      const res = createMockRes();
      deletePerson({ body: undefined, params: { id: pid1 } }, res);
      const rotating = getData()?.chores.find((c) => c.id === cid2) as RotatingChore | undefined;
      // cid2 rotating chore had [pid1, pid2] — pid1 removed, pid2 remains
      expect(rotating).toBeDefined();
      expect(rotating?.rotation).toEqual([pid2]);
    });

    it('removes rotating chore when rotation becomes empty', () => {
      const { context, getData } = makeContext();
      const { deletePerson } = createAdminHandlers(context);
      const res = createMockRes();
      // Delete both people — after pid1, rotation has [pid2]; after pid2, rotation is empty
      deletePerson({ body: undefined, params: { id: pid1 } }, res);
      deletePerson({ body: undefined, params: { id: pid2 } }, res);
      expect(getData()?.chores.find((c) => c.id === cid2)).toBeUndefined();
    });

    it('returns 404 when person not found', () => {
      const { context, mockSave } = makeContext();
      const { deletePerson } = createAdminHandlers(context);
      const res = createMockRes();
      deletePerson({ body: undefined, params: { id: generateTestUUID(999) } }, res);
      expect(res.statusCode).toBe(404);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { deletePerson } = createAdminHandlers(context);
      const res = createMockRes();
      deletePerson({ body: undefined, params: { id: pid1 } }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('postChore', () => {
    it('adds a valid personal chore', () => {
      const { context, mockSave, getData } = makeContext();
      const { postChore } = createAdminHandlers(context);
      const res = createMockRes();
      postChore(
        {
          body: {
            name: 'New Task',
            type: 'personal',
            assignedTo: pid1,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(200);
      expect(getData()?.chores).toHaveLength(3);
      expect(mockSave).toHaveBeenCalled();
    });

    it('adds a valid rotating chore', () => {
      const { context, getData } = makeContext();
      const { postChore } = createAdminHandlers(context);
      const res = createMockRes();
      postChore(
        {
          body: {
            name: 'Rotate',
            type: 'rotating',
            rotation: [pid1, pid2],
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(200);
      expect(getData()?.chores).toHaveLength(3);
    });

    it('returns 400 when validation fails (invalid skip day)', () => {
      const { context, mockSave } = makeContext();
      const { postChore } = createAdminHandlers(context);
      const res = createMockRes();
      postChore(
        {
          body: {
            name: 'Task',
            type: 'personal',
            assignedTo: pid1,
            skipDays: ['not-a-day'],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when rotating chore references unknown person', () => {
      const { context, mockSave } = makeContext();
      const { postChore } = createAdminHandlers(context);
      const res = createMockRes();
      postChore(
        {
          body: {
            name: 'Rotate',
            type: 'rotating',
            rotation: [pid1, generateTestUUID(999)],
            skipDays: [DayOfWeek.MONDAY],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { postChore } = createAdminHandlers(context);
      const res = createMockRes();
      postChore({ body: { name: 'X', type: 'personal', assignedTo: pid1 }, params: {} }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('putChore', () => {
    it('updates an existing chore name', () => {
      const { context, mockSave, getData } = makeContext();
      const { putChore } = createAdminHandlers(context);
      const res = createMockRes();
      putChore({ body: { name: 'Renamed' }, params: { id: cid1 } }, res);
      expect(res.statusCode).toBe(200);
      expect(getData()?.chores.find((c) => c.id === cid1)?.name).toBe('Renamed');
      expect(mockSave).toHaveBeenCalled();
    });

    it('returns 400 when attempting to change chore type', () => {
      const { context, mockSave } = makeContext();
      const { putChore } = createAdminHandlers(context);
      const res = createMockRes();
      putChore({ body: { type: 'rotating' }, params: { id: cid1 } }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 404 when chore not found', () => {
      const { context, mockSave } = makeContext();
      const { putChore } = createAdminHandlers(context);
      const res = createMockRes();
      putChore({ body: { name: 'X' }, params: { id: generateTestUUID(999) } }, res);
      expect(res.statusCode).toBe(404);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { putChore } = createAdminHandlers(context);
      const res = createMockRes();
      putChore({ body: { name: 'X' }, params: { id: cid1 } }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('deleteChore', () => {
    it('removes an existing chore', () => {
      const { context, mockSave, getData } = makeContext();
      const { deleteChore } = createAdminHandlers(context);
      const res = createMockRes();
      deleteChore({ body: undefined, params: { id: cid1 } }, res);
      expect(res.statusCode).toBe(200);
      expect(getData()?.chores.find((c) => c.id === cid1)).toBeUndefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('returns 404 when chore not found', () => {
      const { context, mockSave } = makeContext();
      const { deleteChore } = createAdminHandlers(context);
      const res = createMockRes();
      deleteChore({ body: undefined, params: { id: generateTestUUID(999) } }, res);
      expect(res.statusCode).toBe(404);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { deleteChore } = createAdminHandlers(context);
      const res = createMockRes();
      deleteChore({ body: undefined, params: { id: cid1 } }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('getBackup', () => {
    it('returns JSON with content-disposition header', () => {
      const { context } = makeContext();
      const { getBackup } = createAdminHandlers(context);
      const res = createMockRes();
      getBackup({ body: undefined, params: {} }, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Disposition']).toMatch(/attachment; filename=".+\.json"/);
      expect(res.sentBody).toContain('"people"');
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { getBackup } = createAdminHandlers(context);
      const res = createMockRes();
      getBackup({ body: undefined, params: {} }, res);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('postRestore', () => {
    it('persists a valid restore payload', () => {
      const choreId = generateTestUUID(302);
      const { context, mockSave, mockNotify, getData } = makeContext();
      const { postRestore } = createAdminHandlers(context);
      const res = createMockRes();
      postRestore(
        {
          body: {
            people: [
              { id: pid1, name: 'A', color: '#fff' },
              { id: pid2, name: 'B', color: '#abc' },
            ],
            chores: [
              {
                id: choreId,
                name: 'C',
                type: ChoreType.PERSONAL,
                assignedTo: pid1,
                skipDays: [DayOfWeek.TUESDAY],
                skipDayVisibility: SkipDayVisibility.SHOW_ALWAYS,
                caughtUp: false,
                completedToday: true,
              },
            ],
            lastResetDate: '2025-01-01',
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(200);
      expect(res.jsonBody).toMatchObject({ success: true });
      expect(getData()?.people).toHaveLength(2);
      expect(getData()?.chores).toHaveLength(1);
      expect(mockSave).toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith(SocketNotifications.CHORE_DATA, expect.anything());
    });

    it('returns 400 when body is missing chores', () => {
      const { context, mockSave } = makeContext();
      const { postRestore } = createAdminHandlers(context);
      const res = createMockRes();
      postRestore({ body: { people: [] }, params: {} }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when people is not an array', () => {
      const { context, mockSave } = makeContext();
      const { postRestore } = createAdminHandlers(context);
      const res = createMockRes();
      postRestore({ body: { people: 'bad', chores: [] }, params: {} }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when a person fails validation', () => {
      const { context, mockSave } = makeContext();
      const { postRestore } = createAdminHandlers(context);
      const res = createMockRes();
      postRestore(
        {
          body: { people: [{ id: 'x', name: 'Bad', color: '#fff' }], chores: [] },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toMatchObject({ error: expect.stringContaining('Invalid person') });
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when a chore fails validation', () => {
      const { context, mockSave } = makeContext();
      const { postRestore } = createAdminHandlers(context);
      const res = createMockRes();
      postRestore(
        {
          body: {
            people: [
              { id: pid1, name: 'A', color: '#fff' },
              { id: pid2, name: 'B', color: '#abc' },
            ],
            chores: [
              {
                id: cid1,
                name: 'C',
                type: ChoreType.PERSONAL,
                // references unknown person
                assignedTo: generateTestUUID(404),
                skipDays: [],
                skipDayVisibility: SkipDayVisibility.HIDE,
                caughtUp: true,
                completedToday: false,
              },
            ],
          },
          params: {},
        },
        res
      );
      expect(res.statusCode).toBe(400);
      expect(res.jsonBody).toMatchObject({ error: expect.stringContaining('Invalid chore') });
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('postCopyChores', () => {
    it('copies a personal chore to another person', () => {
      const { context, mockSave, getData } = makeContext();
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      postCopyChores(
        { body: { fromPersonId: pid1, toPersonId: pid2, choreIds: [cid1] }, params: {} },
        res
      );
      expect(res.statusCode).toBe(200);
      const created = res.jsonBody as { id: string; assignedTo: string }[];
      expect(created).toHaveLength(1);
      expect(created[0].assignedTo).toBe(pid2);
      // should have a new UUID, not the original
      expect(created[0].id).not.toBe(cid1);
      expect(getData()?.chores).toHaveLength(3);
      expect(mockSave).toHaveBeenCalled();
    });

    it('skips chores not assigned to fromPersonId', () => {
      const { context, getData } = makeContext();
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      // cid1 is assigned to pid1, not pid2
      postCopyChores(
        { body: { fromPersonId: pid2, toPersonId: pid1, choreIds: [cid1] }, params: {} },
        res
      );
      expect(res.statusCode).toBe(200);
      const created = res.jsonBody as unknown[];
      expect(created).toHaveLength(0);
      expect(getData()?.chores).toHaveLength(2);
    });

    it('skips rotating chores', () => {
      const { context, getData } = makeContext();
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      postCopyChores(
        { body: { fromPersonId: pid1, toPersonId: pid2, choreIds: [cid2] }, params: {} },
        res
      );
      // cid2 is rotating, not personal — should be skipped
      const created = res.jsonBody as unknown[];
      expect(created).toHaveLength(0);
      expect(getData()?.chores).toHaveLength(2);
    });

    it('skips unknown chore IDs', () => {
      const { context, getData } = makeContext();
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      postCopyChores(
        {
          body: { fromPersonId: pid1, toPersonId: pid2, choreIds: [generateTestUUID(999)] },
          params: {},
        },
        res
      );
      const created = res.jsonBody as unknown[];
      expect(created).toHaveLength(0);
      expect(getData()?.chores).toHaveLength(2);
    });

    it('returns 400 when required fields are missing', () => {
      const { context, mockSave } = makeContext();
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      postCopyChores({ body: { fromPersonId: pid1 }, params: {} }, res);
      expect(res.statusCode).toBe(400);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 500 when data is null', () => {
      const { context } = makeContext(null);
      const { postCopyChores } = createAdminHandlers(context);
      const res = createMockRes();
      postCopyChores(
        { body: { fromPersonId: pid1, toPersonId: pid2, choreIds: [cid1] }, params: {} },
        res
      );
      expect(res.statusCode).toBe(500);
    });
  });
});
