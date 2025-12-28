import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/profile/page"; 
import { MantineProvider } from "@mantine/core";
import * as chefLib from "@/lib/chef";
import { notifications } from "@mantine/notifications";

// 1. Mock internal library (Slide 32)
jest.mock("@/lib/chef", () => ({
  fetchProfile: jest.fn(),
  updateUsername: jest.fn(),
  fetchChefOwnProfile: jest.fn(),
  fetchChefStats: jest.fn(),
  fetchChefRecipes: jest.fn(),
  deleteChefRecipe: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
}));

// 2. Mock external Mantine library (REMOVE THE @/ PREFIX)
jest.mock("@mantine/notifications", () => ({
  notifications: {
    show: jest.fn(),
  },
}));

const wrapper = ({ children }: any) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("ProfilePage: Multi-Path & Functional Testing", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful profile fetch to avoid null crashes
    (chefLib.fetchProfile as jest.Mock).mockResolvedValue({
      username: "Tarik",
      email: "tarik@itu.edu.tr",
      role: "consumer"
    });
  });

  it("Path 1: should render Consumer view when role is 'consumer' (Slide 20)", async () => {
    render(<ProfilePage />, { wrapper });

    // findByText handles the initial 'loading' state automatically
    const name = await screen.findByText("Tarik");
    expect(name).toBeInTheDocument();
    
    expect(screen.getByText("User")).toBeInTheDocument(); 
    expect(screen.queryByText("Chef Stats")).not.toBeInTheDocument();
  });

  it("Path 2: should render Chef view and fetch stats when role is 'chef'", async () => {
    (chefLib.fetchProfile as jest.Mock).mockResolvedValue({
      username: "ChefArda",
      role: "chef",
      email: "arda@itu.edu.tr"
    });
    (chefLib.fetchChefStats as jest.Mock).mockResolvedValue({
      total_recipes: 5,
      total_ratings: 10,
      recipes_by_category: {}
    });
    (chefLib.fetchChefRecipes as jest.Mock).mockResolvedValue({ recipes: [] });
    (chefLib.fetchChefOwnProfile as jest.Mock).mockResolvedValue({});

    render(<ProfilePage />, { wrapper });

    // Verify logic fork: Chef elements should be visible
    expect(await screen.findByText("Chef Stats")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); 
  });

  it("should validate username length (Boundary Value - Slide 65)", async () => {
    render(<ProfilePage />, { wrapper });

    // Wait for form to appear
    const input = await screen.findByLabelText("Username");
    
    // Simulate invalid input (Black-Box Testing)
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it("should trigger successful username update and show notification (Slide 37)", async () => {
    (chefLib.updateUsername as jest.Mock).mockResolvedValue({ msg: "Success" });

    render(<ProfilePage />, { wrapper });

    const input = await screen.findByLabelText("Username");
    fireEvent.change(input, { target: { value: "NewName" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(chefLib.updateUsername).toHaveBeenCalledWith("NewName");
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Profile updated" })
      );
    });
  });
});
