import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('MKing Friend')).toBeInTheDocument();
  });

  it('renders navigation header', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<App />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays home page content by default', () => {
    render(<App />);
    expect(screen.getByText(/Find Your Perfect/i)).toBeInTheDocument();
    expect(screen.getByText(/Friend Match/i)).toBeInTheDocument();
  });
});