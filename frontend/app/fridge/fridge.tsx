import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from "next/router";
import styles from './index.module.css';

interface FridgeItem {
  id: number;
  ingredient_id: number;
  name: string;
  unit: string;
  quantity?: number;
}

const FridgePage: NextPage = () => {
  const router = useRouter();
  
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api/fridge';

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const fetchFridgeItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/`, {
        method: 'GET',
        headers: getAuthHeader(),
      });

      if (res.ok) {
        const data = await res.json();
        setFridgeItems(data);
      } else {
        if (res.status === 401) router.push('/login');
        setError('Veriler yüklenemedi.');
      }
    } catch (err) {
      setError('Sunucu hatası.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFridgeItems();
  }, [fetchFridgeItems]);

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (res.ok) {
        setFridgeItems(prev => prev.filter(item => item.id !== id));
      } else {
        alert("Silme işlemi başarısız.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  const handleAddItem = async () => {
    const name = prompt("Malzeme Adı:");
    const quantity = prompt("Miktar:");
    const unit = prompt("Birim (kg, lt, adet):");

    if (!name || !quantity) return;

    try {
      const res = await fetch(`${API_URL}/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          ingredient_name: name,
          quantity: parseFloat(quantity),
          unit: unit || 'adet'
        })
      });

      if (res.ok) {
        fetchFridgeItems();
      } else {
        alert("Ekleme başarısız.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onMyFridgeTextClick = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className={styles.fridgePage}>
      <div className={styles.contentAreaParent}>
        <div className={styles.contentArea} />
        
        <div className={styles.rectangleParent}>
          <div className={styles.groupChild} />
          <div className={styles.frameParent}>
            <div className={styles.recipeRowParent}>
              
              {isLoading && <div style={{padding: '20px'}}>Yükleniyor...</div>}
              {error && <div style={{padding: '20px', color: 'red'}}>{error}</div>}

              {!isLoading && fridgeItems.map((item) => (
                <div className={styles.recipeRow} key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
                  <div style={{ flex: 1, fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ flex: 1 }}>{item.quantity ? `${item.quantity} ${item.unit}` : item.unit}</div>
                  
                  <div className={styles.iconBox}>
                    <Image 
                      className={styles.editPencilIcon} 
                      width={28} 
                      height={28} 
                      alt="Edit" 
                      src="/path-to-edit-icon.png"
                    />
                  </div>

                  <div className={styles.iconBox10} onClick={() => handleDeleteItem(item.id)} style={{cursor: 'pointer'}}>
                    <Image className={styles.closeIcon5} width={28} height={28} alt="Delete" src="/path-to-close-icon.png" />
                  </div>
                </div>
              ))}
              
              {!isLoading && fridgeItems.length === 0 && (
                 <div style={{padding: '20px', textAlign: 'center'}}>Dolabınız boş.</div>
              )}

            </div>
          </div>
          
          <div className={styles.frameChild} />
          
          <div className={styles.ingredientNameParent}>
            <div className={styles.ingredientName}>Ingredient Name</div>
            <div className={styles.description}>Unit</div>
            <div className={styles.amount}>Amount</div>
          </div>

          <div className={styles.button} onClick={handleAddItem} style={{cursor: 'pointer'}}>
            <div className={styles.text}>Add Ingredient</div>
          </div>

          <div className={styles.iconBox17}>
            <Image className={styles.editPencilIcon} width={28} height={28} alt="" src="/path-to-pencil.png" />
          </div>
        </div>

        <div className={styles.groupParent}>
          <div className={styles.rectangleGroup}>
            <div className={styles.groupItem} />
            <input 
                type="text" 
                className={styles.search} 
                placeholder="Search..." 
                style={{border: 'none', background: 'transparent', outline: 'none', width: '80%'}}
            />
          </div>
          <div className={styles.filters}>Search by Name</div>
        </div>

        <div className={styles.groupContainer}>
          <div className={styles.rectangleContainer}>
            <div className={styles.groupInner} />
            <div className={styles.mostAmount}>Most Amount</div>
          </div>
          <div className={styles.filters}>Sort By</div>
        </div>
      </div>

      <div className={styles.myFridge}>My Fridge</div>
      
      <div className={styles.navbarMain}>
        <div className={styles.navbar} />
        <div className={styles.discoverParent}>
          <div className={styles.discover}>Discover</div>
          <div className={styles.discover} onClick={onMyFridgeTextClick}>My Fridge</div>
          <div className={styles.recipesParent}>
            <div className={styles.recipes}>Recipes</div>
            <Image className={styles.expandArrowIcon} width={32} height={32} alt="" src="/path-to-arrow.png" />
          </div>
          <div className={styles.discover}>Profile</div>
        </div>
        <div className={styles.branding}>
          <Image className={styles.naturalFoodIcon} width={48} height={48} alt="" src="/path-to-food-icon.png" />
          <div className={styles.text}>Nutrify</div>
        </div>
      </div>
    </div>
  );
};

export default FridgePage;