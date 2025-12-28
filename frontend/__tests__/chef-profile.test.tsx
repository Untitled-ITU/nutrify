import { render, screen, waitFor } from "@testing-library/react";
import ChefProfilePage from "@/app/chef-profile/[chefId]/page";
import { MantineProvider } from "@mantine/core";
import * as chefLib from "@/lib/chef";
import { useParams, useRouter } from "next/navigation";

// --- Step 1: Stable Mocks (Slide 31) ---
// We define these OUTSIDE the mock function so they are stable references
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: () => mockRouter, // Return the same object every time to prevent loops
}));

jest.mock("@/lib/chef", () => ({
  fetchProfile: jest.fn(),
  fetchChefPublicProfile: jest.fn(),
}));

const wrapper = ({ children }: any) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("ChefProfilePage: Path Coverage", () => {
  const ID_NUM = 123;
  const mockChefData = {
    chef_id: ID_NUM,
    username: "ChefGord",
    recipes: [{ id: 1, title: "Beef Wellington" }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure useParams returns a stable value
    (useParams as jest.Mock).mockReturnValue({ chefId: String(ID_NUM) });
  });

  it("Path: Guest Viewer (Slide 20 - Branch A)", async () => {
    // Stub: Viewer is not the owner
    (chefLib.fetchProfile as jest.Mock).mockResolvedValue({ id: 999 });
    (chefLib.fetchChefPublicProfile as jest.Mock).mockResolvedValue(mockChefData);

    render(<ChefProfilePage />, { wrapper });

    // Use a function matcher for text (Slide 93: robust web testing)
    // This finds the text even if Mantine splits it into multiple spans
    const nameElement = await screen.findByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && content.includes("ChefGord");
    }, {}, { timeout: 3000 });
    
    expect(nameElement).toBeInTheDocument();
    expect(screen.queryByText(/Add Recipe/i)).not.toBeInTheDocument();
  });

  it("Path: Account Owner (Slide 20 - Branch B)", async () => {
    // Stub: Viewer IS the owner
    (chefLib.fetchProfile as jest.Mock).mockResolvedValue({ id: ID_NUM });
    (chefLib.fetchChefPublicProfile as jest.Mock).mockResolvedValue(mockChefData);

    render(<ChefProfilePage />, { wrapper });

    // Wait for an owner-specific button to appear
    const addBtn = await screen.findByText(/Add Recipe/i, {}, { timeout: 3000 });
    expect(addBtn).toBeInTheDocument();
    expect(screen.getByText(/Edit Profile/i)).toBeInTheDocument();
  });
});
