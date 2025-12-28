import { render, screen } from "@testing-library/react";
import Home from "@/app/page"; // Adjust path based on your structure
import { MantineProvider } from "@mantine/core";
import { useAuth } from "@/app/providers/AuthProvider";
import '@testing-library/jest-dom';

// 1. Mock the Auth Provider hook
jest.mock("@/app/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// 2. Mock the RandomRecipeCard to keep the test focused on the Home page logic
jest.mock("@/components/recipes/RandomRecipeCard", () => ({
  RandomRecipeCard: () => <div data-testid="random-recipe-card">Mock Recipe Card</div>,
}));

// Helper to wrap component in MantineProvider (required for Mantine components)
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("Home Page (Landing)", () => {
  
  it("renders correctly for guest users (unauthenticated)", () => {
    // Simulate null user
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    renderWithTheme(<Home />);

    // Check for welcome text
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutrify!/i)).toBeInTheDocument();

    // Check for Sign Up buttons
    expect(screen.getByRole("link", { name: /sign up to get started/i })).toHaveAttribute(
      "href",
      "/auth/signup"
    );

    // Check for Chef section
    expect(screen.getByRole("heading", { name: /as a chef/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up as a chef/i })).toHaveAttribute(
      "href",
      "/auth/signup?role=chef"
    );

    // Ensure user-specific buttons are NOT visible
    expect(screen.queryByText(/Let's discover new recipes/i)).not.toBeInTheDocument();
  });

  it("renders correctly for logged-in users", () => {
    // Simulate a logged-in user
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: "Arda" },
    });

    renderWithTheme(<Home />);

    // Check personalized greeting
    expect(screen.getByText(/Hi again Arda!/i)).toBeInTheDocument();

    // Check for User action buttons
    expect(screen.getByRole("link", { name: /discover new recipes/i })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(screen.getByRole("link", { name: /check out your favorites/i })).toHaveAttribute(
      "href",
      "/recipes/favorites"
    );

    // Ensure signup buttons are NOT visible
    expect(screen.queryByText(/Sign up to get started/i)).not.toBeInTheDocument();
  });

  it("always renders the RandomRecipeCard", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    renderWithTheme(<Home />);
    
    expect(screen.getByTestId("random-recipe-card")).toBeInTheDocument();
  });
});
