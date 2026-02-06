let mockUuidCounter = 0;

export const randomUUID = jest.fn(() => {
  mockUuidCounter++;
  return `mock-uuid-${mockUuidCounter}-${Date.now()}`;
});

export const getRandomBytes = jest.fn((size: number) => new Uint8Array(size));
export const getRandomBytesAsync = jest.fn((size: number) => Promise.resolve(new Uint8Array(size)));
export const digestStringAsync = jest.fn(() => Promise.resolve('mock-hash'));

// 테스트용 리셋 함수
export const _resetMockUuidCounter = () => {
  mockUuidCounter = 0;
};
