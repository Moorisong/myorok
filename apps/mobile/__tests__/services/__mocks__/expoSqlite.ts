const mockDb = {
  runAsync: jest.fn(() => Promise.resolve()),
  execAsync: jest.fn(() => Promise.resolve()),
  getFirstAsync: jest.fn(() => Promise.resolve(null)),
  getAllAsync: jest.fn(() => Promise.resolve([])),
};

export const openDatabaseAsync = jest.fn(() => Promise.resolve(mockDb));
export const SQLiteProvider = ({ children }: { children: React.ReactNode }) => children;
export const useSQLiteContext = jest.fn(() => mockDb);

export const _getMockDb = () => mockDb;
