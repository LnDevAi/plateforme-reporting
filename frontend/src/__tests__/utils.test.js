// Tests utilitaires simples
describe('Utility Functions', () => {
  test('string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
    expect('WORLD'.toLowerCase()).toBe('world');
    expect('test'.length).toBe(4);
  });

  test('array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
    expect(arr.includes(5)).toBe(false);
  });

  test('object operations', () => {
    const obj = { name: 'EPE', version: '1.0.0' };
    expect(obj.name).toBe('EPE');
    expect(Object.keys(obj).length).toBe(2);
  });

  test('date operations', () => {
    const now = new Date();
    expect(now instanceof Date).toBe(true);
    expect(typeof now.getTime()).toBe('number');
  });
});