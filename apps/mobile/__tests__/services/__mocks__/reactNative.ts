export const Platform = {
  OS: 'android',
  select: (obj: { android?: any; ios?: any }) => obj.android,
};
