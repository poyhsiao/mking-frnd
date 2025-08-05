import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    const element = screen.getByRole('banner');
    expect(element).toBeTruthy();
  });

  it('renders navigation header', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(header).toBeTruthy();
  });

  it('renders main content area', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeTruthy();
  });

  it('renders footer', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeTruthy();
  });

  it('displays home page content by default', () => {
    render(<App />);
    const perfectText = screen.getByText(/Find Your Perfect/i);
    const matchText = screen.getByText(/Friend Match/i);
    expect(perfectText).toBeTruthy();
    expect(matchText).toBeTruthy();
  });
});
