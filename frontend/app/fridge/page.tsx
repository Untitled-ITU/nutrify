"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { 
  Button, 
  Loader, 
  ActionIcon, 
  Modal, 
  NumberInput, 
  Group, 
  Stack,
  Select,
  useMantineTheme
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconX, IconPlus } from "@tabler/icons-react";
import { authFetch } from "../providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

// Import the ingredients data
import ingredientsJson from "@/ingredients.json";
const INGREDIENT_UNITS = ingredientsJson as Record<string, string[]>;

interface FridgeItem {
  id: number;
  quantity: number;
  unit: string;
  ingredient: { 
    id: number;
    name: string;
    default_unit?: string;
  }; 
}

export default function FridgePage() {
  const theme = useMantineTheme();
  const router = useRouter();
  
  const [opened, { open, close }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);

  const [newItemName, setNewItemName] = useState<string | null>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number | string>(1);
  const [newItemUnit, setNewItemUnit] = useState<string | null>("");

  const [items, setItems] = useState<FridgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize options from JSON
  const ingredientOptions = useMemo(
    () => Object.keys(INGREDIENT_UNITS).sort(),
    []
  );

  // Derived unit options strictly from JSON
  const unitOptions = useMemo(() => {
    if (newItemName && INGREDIENT_UNITS[newItemName]) {
        return INGREDIENT_UNITS[newItemName];
    }
    return [];
  }, [newItemName]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/fridge/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []); 
      } else if (res.status === 401) {
        router.push('/auth/login');
      } else {
        setError(`Error: ${res.statusText}`);
      }
    } catch (error) {
      setError("Failed to connect.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCloseModal = () => {
      setEditingItem(null);
      setNewItemName("");
      setNewItemQuantity(1);
      setNewItemUnit("");
      close();
  };

  const openEditModal = (item: FridgeItem) => {
      setEditingItem(item);
      setNewItemName(item.ingredient.name);
      setNewItemQuantity(item.quantity);
      setNewItemUnit(item.unit);
      open();
  };

  const handleSave = async () => {
    if (!newItemName || !newItemUnit) return;

    try {
      let url = `${API_BASE_URL}/api/fridge/items`;
      let method = 'POST';
      
      if (editingItem) {
          url = `${API_BASE_URL}/api/fridge/${editingItem.id}`;
          method = 'PUT';
      }

      const res = await authFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ingredient_name: newItemName, // Send name; backend handles mapping to ID
            quantity: typeof newItemQuantity === 'number' ? newItemQuantity : parseFloat(newItemQuantity as string || '0'),
            unit: newItemUnit,
        })
      });

      if (res.ok) {
        fetchItems();
        handleCloseModal(); 
      } else {
        alert("Failed to save item. Please ensure all fields are filled.");
      }
    } catch (error) { console.error(error); }
  };

  const onDeleteItem = async (id: number) => {
    if (!confirm("Remove this item?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/fridge/${id}`, { method: 'DELETE' });
      if (res.ok) setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) { console.error(error); }
  };

  const filteredItems = items.filter(item => 
    item.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-4">
      <Modal 
        opened={opened} 
        onClose={handleCloseModal} 
        title={editingItem ? "Edit Ingredient Amount" : "Add Ingredient"}
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Stack>
            <Select 
                label="Ingredient Name" 
                placeholder="Select an ingredient" 
                searchable
                nothingFoundMessage="Ingredient not found in list"
                data={ingredientOptions}
                value={newItemName}
                disabled={!!editingItem}
                onChange={(val) => {
                    setNewItemName(val);
                    setNewItemUnit(null); // Force unit selection again
                }}
            />
            
            <Group grow align="end">
                <NumberInput 
                    label="Quantity" 
                    placeholder="0" 
                    min={0.25}
                    step={0.25}
                    value={newItemQuantity}
                    onChange={(val) => setNewItemQuantity(val)}
                />
                
                <Select 
                    label="Unit" 
                    placeholder="Unit" 
                    data={unitOptions} 
                    value={newItemUnit}
                    disabled={!newItemName}
                    onChange={(val) => setNewItemUnit(val)}
                />
            </Group>

            <Button 
                onClick={handleSave}
                fullWidth mt="md" radius="md"
                disabled={!newItemName || !newItemUnit}
                style={{ backgroundColor: '#896c6c' }}
            >
                {editingItem ? "Update Amount" : "Save to Fridge"}
            </Button>
        </Stack>
      </Modal>

      <h1 className="text-4xl font-bold mb-8">My Fridge</h1>

      <div className="flex justify-between items-end mb-8 flex-wrap gap-5">
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Search by Name</label>
            <div className="bg-[#e5beb5] rounded-xl px-4 py-2 w-[300px] flex items-center h-[42px]">
                <input 
                    className="bg-transparent border-none outline-none text-base w-full text-[#5D4037] font-medium placeholder-[#5D4037]/50"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1"></div>

        <Button 
            leftSection={<IconPlus size={20} />}
            size="md" radius="lg"
            onClick={open} 
            style={{ backgroundColor: '#896c6c' }}
            className="hover:opacity-90 transition-opacity shadow-md text-white border-none h-[42px]"
        >
            Add Ingredient
        </Button>
      </div>

      <div className="flex px-5 mb-3 font-bold text-lg text-[#333]">
          <div className="flex-[3]">Ingredient Name</div>
          <div className="flex-1">Amount</div>
          <div className="w-[100px]"></div>
      </div>
      
      <div className="w-full h-[1px] bg-black/20 mb-4"></div>

      <div className="flex flex-col gap-3 pb-10">
          {isLoading && (
              <div className="flex justify-center p-5"><Loader color="#896c6c" /></div>
          )}
          
          {!isLoading && error && (
             <div className="text-center p-5 text-red-600 font-bold">{error}</div>
          )}

          {!isLoading && !error && filteredItems.length === 0 && (
              <div className="text-center p-10 text-gray-500 text-xl">
                  {searchTerm ? "No matching ingredients." : "Your fridge is empty."}
              </div>
          )}

          {!isLoading && filteredItems.map((item) => (
              <div key={item.id} className="bg-[#e5beb5] rounded-xl p-3 px-5 flex items-center justify-between text-[#171717] font-semibold text-lg hover:brightness-95 transition-all">
                  <div className="flex-[3]">{item.ingredient.name}</div>
                  <div className="flex-1 font-bold">{item.quantity} {item.unit}</div>
                  <div className="flex gap-2 w-[100px] justify-end">
                      <ActionIcon 
                        size="lg" radius="md" 
                        className="text-white" 
                        style={{ backgroundColor: theme.other.accentColor }}
                        onClick={() => openEditModal(item)}
                      >
                          <IconPencil size={18} />
                      </ActionIcon>
                      
                      <ActionIcon 
                        size="lg" radius="md" 
                        className="text-white" 
                        style={{ backgroundColor: theme.other.accentColor }}
                        onClick={() => onDeleteItem(item.id)}
                      >
                          <IconX size={18} />
                      </ActionIcon>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}
