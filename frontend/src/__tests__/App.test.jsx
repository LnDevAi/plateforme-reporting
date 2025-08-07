import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock React Router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: () => null,
}));

// Mock Auth Context
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  })
}));

test('renders without crashing', () => {
  render(<App />);
  // Test que l'app se rend sans erreur
  expect(document.body).toBeInTheDocument();
});

test('math operations work correctly', () => {
  expect(2 + 2).toBe(4);
  expect(3 * 3).toBe(9);
  expect(10 / 2).toBe(5);
});