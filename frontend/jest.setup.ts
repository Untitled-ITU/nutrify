import '@testing-library/jest-dom';

// Polyfill ResizeObserver (Required for Mantine Modals & ScrollAreas)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock matchMedia (Mantine needs this)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
  redirect: jest.fn(),
  RedirectType: { replace: 'replace' }
}));

window.confirm = jest.fn();
window.alert = jest.fn();
global.fetch = jest.fn();
global.alert = jest.fn();
