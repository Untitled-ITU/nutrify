"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { 
  Button, 
  Loader, 
  ActionIcon, 
  Modal, 
  TextInput, 
  NumberInput, 
  Group, 
  Stack,
  Text,
  Badge
} from "@mantine/core";
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { Button, Loader, ActionIcon, useMantineTheme } from "@mantine/core";
import { IconPencil, IconX, IconPlus } from "@tabler/icons-react";
import { authFetch } from "../providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

interface FridgeItem {
  id: number;
  quantity: number;
  unit: string;
  description?: string;
  ingredient: { 
    id: number;
    name: string;
    default_unit?: string;
  }; 
  quantity?: number;
  ingredient?: { name: string }; 
}

export default function FridgePage() {
  const router = useRouter();
  const theme = useMantineTheme();
  
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Fetch failed:", error);
      setError("Failed to connect.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const checkIngredient = async () => {
        if (editingItem) return;
        if (!debouncedName || debouncedName.length < 2) {
            setIngredientExists(null);
            return;
        }

        setIsChecking(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/ingredients?search=${debouncedName}`);
            if (res.ok) {
                const data = await res.json();
                const found = data.items?.some((i: any) => i.name.toLowerCase() === debouncedName.toLowerCase());
                setIngredientExists(!!found);
            } else {
                setIngredientExists(false);
            }
        } catch (error) {
            setIngredientExists(false);
        } finally {
            setIsChecking(false);
        }
    };

    checkIngredient();
  }, [debouncedName, editingItem]);

  const handleCloseModal = () => {
      setEditingItem(null);
      setNewItemName("");
      setNewItemQuantity("");
      setNewItemUnit("");
      setNewItemDescription("");
      setIngredientExists(null);
      close();
  };

  const openEditModal = (item: FridgeItem) => {
      setEditingItem(item);
      setNewItemName(item.ingredient.name);
      setNewItemQuantity(item.quantity);
      setNewItemUnit(item.unit);
      setNewItemDescription(item.description || "");
      open();
  };

  const handleSave = async () => {
    if (!newItemName) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/fridge/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ingredient_name: name,
            quantity: parseFloat(quantity || '0'),
            unit: unit || 'pcs'
        })
      });
      if (res.ok) {
        fetchItems();
      } else {
        alert("Failed to add item.");
      }
    } catch (error) { console.error(error); }
  }, [fetchItems]);

  const onDeleteItem = async (id: number) => {
    if (!confirm("Remove this item?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/fridge/${id}`, { 
        method: 'DELETE'
      });
      if (res.ok) setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) { console.error(error); }
  };

  const filteredItems = items.filter(item => 
    item.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-4">
      
      <h1 className="text-4xl font-bold mb-8">
        My Fridge
      </h1>

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

        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Sort By</label>
            <div className="bg-[#e5beb5] rounded-xl px-5 py-2 text-base font-medium cursor-pointer text-[#171717] h-[42px] flex items-center">
                Most Amount
            </div>
        </div>

        <div className="flex-1"></div>

        <Button 
            leftSection={<IconPlus size={20} />}
            size="md" 
            radius="lg"
            onClick={onAddIngredientClick}
            style={{ backgroundColor: '#896c6c' }}
            className="hover:opacity-90 transition-opacity shadow-md text-white border-none h-[42px]"
        >
            Add Ingredient
        </Button>
      </div>

      <div className="flex px-5 mb-3 font-bold text-lg text-[#333]">
          <div className="flex-[2]">Ingredient Name</div>
          <div className="flex-[2]">Description</div>
          <div className="flex-1">Amount</div>
          <div className="w-[100px]"></div>
      </div>
      
      <div className="w-full h-[1px] bg-black/20 mb-4"></div>

      <div className="flex flex-col gap-3 pb-10">
          
          {isLoading && (
              <div className="flex justify-center p-5">
                  <Loader color="#896c6c" />
              </div>
          )}
          
          {!isLoading && error && (
             <div className="text-center p-5 text-red-600 font-bold">{error}</div>
          )}

          {!isLoading && !error && filteredItems.length === 0 && (
              <div className="text-center p-10 text-gray-500 text-xl">
                  Your fridge is empty. Click "Add Ingredient" to start!
              </div>
          )}

          {!isLoading && filteredItems.map((item) => (
              <div key={item.id} className="bg-[#e5beb5] rounded-xl p-3 px-5 flex items-center justify-between text-[#171717] font-semibold text-lg hover:brightness-95 transition-all">
                  <div className="flex-[2]">{item.ingredient.name}</div>
                  <div className="flex-[2] text-sm text-[#555]">{item.description || '-'}</div>
                  <div className="flex-1 font-bold">{item.quantity} {item.unit}</div>
                  <div className="flex-[2]">{getIngredientName(item)}</div>
                  <div className="flex-[2] text-sm text-[#555]">-</div>
                  <div className="flex-1 font-bold">
                      {item.quantity} {item.unit}
                  </div>
                  
                  <div className="flex gap-2 w-[100px] justify-end">
                      <ActionIcon 
                          size="lg"
                          radius="md"
                          className="bg-[#896c6c] hover:bg-[#7a5e5e] text-white"
                          onClick={() => console.log('Edit')}
                      >
                          <IconPencil size={18} />
                      </ActionIcon>
                      
                      <ActionIcon 
                          size="lg"
                          radius="md"
                          className="bg-[#896c6c] hover:bg-[#7a5e5e] text-white"
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