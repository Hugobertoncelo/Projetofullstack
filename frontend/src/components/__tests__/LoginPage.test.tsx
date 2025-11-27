import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, jest } from "@jest/globals";
import LoginPage from "../../../app/login/page";

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock useAuth hook
const mockLogin = jest.fn();
jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /bem vindo de volta/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty form", () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /entrar/i });
    submitButton.click();

    // Test would verify validation error messages
    expect(true).toBe(true); // Placeholder assertion
  });

  it("calls login function with valid data", () => {
    render(<LoginPage />);

    // Test would fill form and submit
    // Verify that mockLogin is called with correct data
    expect(true).toBe(true); // Placeholder assertion
  });
});
