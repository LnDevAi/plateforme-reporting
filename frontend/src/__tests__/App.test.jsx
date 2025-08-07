import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';

// Test simple pour valider la configuration
const SimpleTestComponent = () => {
  return (
    <div>
      <h1>Plateforme EPE</h1>
      <p>Application de Reporting pour EPE</p>
    </div>
  );
};

describe('App Configuration Tests', () => {
  test('renders test component successfully', () => {
    render(<SimpleTestComponent />);
    
    expect(screen.getByText('Plateforme EPE')).toBeInTheDocument();
    expect(screen.getByText('Application de Reporting pour EPE')).toBeInTheDocument();
  });

  test('basic React functionality works', () => {
    const { container } = render(<SimpleTestComponent />);
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('h1')).toHaveTextContent('Plateforme EPE');
  });

  test('Jest matchers work correctly', () => {
    expect(true).toBe(true);
    expect('plateforme').toContain('forme');
    expect(['EPE', 'OHADA', 'UEMOA']).toHaveLength(3);
  });

  test('environment setup is correct', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(window.matchMedia).toBeDefined();
  });
});