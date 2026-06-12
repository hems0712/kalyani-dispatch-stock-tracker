
'use client';

import React, { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PARTS_MASTER_LIST, BIN_MULTIPLIERS } from './constants';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  writeBatch
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

export interface PlanRevision {
  timestamp: string;
  quantity: number;
}

export interface StockRevision {
  timestamp: string;
  binCount: number;
  pdiStock: number;
  type?: 'ENTRY' | 'COMMIT';
}

export interface PartStock {
  id: string;
  partNumber: string;
  pdiStock: number;
  binCount: number;
  plannedDispatch: number;
  v1Plan: number;
  v2Plan: number;
  v3Plan: number;
  v4Plan: number;
  v1Load: number;
  v2Load: number;
  v3Load: number;
  v4Load: number;
  v1Shipped: number;
  v2Shipped: number;
  v3Shipped: number;
  v4Shipped: number;
  shippedQuantity: number;
  planHistory: PlanRevision[];
  stockHistory: StockRevision[];
}

export interface VehicleStatus {
  isDispatched: boolean;
  dispatchedAt: string | null;
}

export type UserRole = 'ADMIN' | 'VIEWER' | null;

interface UserProfile {
  userId: string;
  role: UserRole;
}

type VehicleKey = 'v1Load' | 'v2Load' | 'v3Load' | 'v4Load';

interface AppState {
  stocks: PartStock[];
  vehicleStatuses: Record<string, VehicleStatus>;
  user: UserProfile | null;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  updateStock: (partNumber: string, updates: Partial<PartStock>) => void;
  updateBinCount: (partNumber: string, binCount: number) => void;
  saveStockData: () => Promise<void>;
  loadPartToVehicle: (partNumber: string, vehicleKey: VehicleKey, qty: number) => boolean;
  clearVehicle: (vehicleKey: VehicleKey) => void;
  dispatchVehicle: (vehicleKey: VehicleKey) => void;
  recallVehicle: (vehicleKey: VehicleKey) => void;
  resetDailyData: () => Promise<void>;
  isLoading: boolean;
  isReadOnly: boolean;
  toggleReadOnly: () => void;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const DEFAULT_VEHICLE_STATUSES: Record<string, VehicleStatus> = {
  v1Load: { isDispatched: false, dispatchedAt: null },
  v2Load: { isDispatched: false, dispatchedAt: null },
  v3Load: { isDispatched: false, dispatchedAt: null },
  v4Load: { isDispatched: false, dispatchedAt: null },
};

const INITIAL_STOCKS: PartStock[] = PARTS_MASTER_LIST.map((p, index) => ({
  id: (index + 1000).toString(),
  partNumber: p,
  pdiStock: 0,
  binCount: 0,
  plannedDispatch: 0,
  v1Plan: 0,
  v2Plan: 0,
  v3Plan: 0,
  v4Plan: 0,
  v1Load: 0,
  v2Load: 0,
  v3Load: 0,
  v4Load: 0,
  v1Shipped: 0,
  v2Shipped: 0,
  v3Shipped: 0,
  v4Shipped: 0,
  shippedQuantity: 0,
  planHistory: [],
  stockHistory: []
}));

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stocks, setStocks] = useState<PartStock[]>(INITIAL_STOCKS);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReadOnlyState, setIsReadOnlyState] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<string, VehicleStatus>>(DEFAULT_VEHICLE_STATUSES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const firestore = useFirestore();

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPreviewMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const savedUser = localStorage.getItem('dispatch_user');
    const cachedStocks = localStorage.getItem('cached_factory_stocks');
    const cachedVehicles = localStorage.getItem('cached_vehicle_status');
    const savedTheme = localStorage.getItem('factory_theme') as 'light' | 'dark' | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    if (cachedStocks) {
      try {
        const parsed = JSON.parse(cachedStocks);
        if (parsed && parsed.length > 0) {
          setStocks(parsed);
          setTimeout(() => setIsLoading(false), 150);
        }
      } catch (e) {}
    }

    if (cachedVehicles) {
      try {
        setVehicleStatuses(JSON.parse(cachedVehicles));
      } catch (e) {}
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsReadOnlyState(parsedUser.role === 'VIEWER');
      } catch (e) {
        localStorage.removeItem('dispatch_user');
      }
    } else if (pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!firestore || !hasMounted) return;

    const unsubParts = onSnapshot(collection(firestore, 'parts'), (snapshot) => {
      setStocks(prev => {
        const remoteData = snapshot.docs.map(doc => ({ ...doc.data(), partNumber: doc.id, id: doc.id } as any));
        const next = prev.map(localPart => {
          const remotePart = remoteData.find(rp => rp.partNumber === localPart.partNumber);
          return remotePart ? { 
            ...localPart, 
            ...remotePart,
            planHistory: remotePart.planHistory || localPart.planHistory || [],
            stockHistory: remotePart.stockHistory || localPart.stockHistory || []
          } : localPart;
        });
        localStorage.setItem('cached_factory_stocks', JSON.stringify(next));
        return next;
      });
      setIsLoading(false);
    }, (err) => {
      setIsLoading(false);
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'parts', operation: 'list' }));
    });

    const unsubVehicles = onSnapshot(doc(firestore, 'settings', 'vehicles'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVehicleStatuses(prev => ({ ...prev, ...data }));
        localStorage.setItem('cached_vehicle_status', JSON.stringify(data));
      }
    });

    return () => {
      unsubParts();
      unsubVehicles();
    };
  }, [firestore, hasMounted]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('factory_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const login = (userId: string, pass: string): boolean => {
    const lowerId = userId.toLowerCase();
    let profile: UserProfile | null = null;
    if (lowerId === 'kalyani' && pass === '12345') profile = { userId: 'kalyani', role: 'ADMIN' };
    else if (lowerId === '12345' && pass === '12345') profile = { userId: '12345', role: 'VIEWER' };

    if (profile) {
      setUser(profile);
      setIsReadOnlyState(profile.role === 'VIEWER');
      localStorage.setItem('dispatch_user', JSON.stringify(profile));
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsReadOnlyState(true);
    localStorage.removeItem('dispatch_user');
    router.push('/login');
  };

  const toggleReadOnly = () => {
    if (user && user.role === 'VIEWER') return;
    setIsReadOnlyState(prev => !prev);
  };

  const togglePreviewMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsPreviewMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsPreviewMode(false);
    }
  };

  const updateStock = (partNumber: string, updates: Partial<PartStock>) => {
    setStocks(prev => prev.map(s => s.partNumber === partNumber ? { ...s, ...updates } : s));
    if (user?.role === 'ADMIN' && firestore) {
      setDoc(doc(firestore, 'parts', partNumber), updates, { merge: true })
        .catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `parts/${partNumber}`, operation: 'update', requestResourceData: updates }));
        });
    }
  };

  const updateBinCount = (partNumber: string, binCount: number) => {
    const validatedBinCount = Math.max(0, binCount);
    setStocks(prev => prev.map(s => s.partNumber === partNumber ? { ...s, binCount: validatedBinCount } : s));
  };

  const saveStockData = async () => {
    if (user?.role !== 'ADMIN' || !firestore) return;
    
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const batch = writeBatch(firestore);
    
    const updates = stocks.map(s => {
      const addedBins = s.binCount || 0;
      if (addedBins === 0) return null;

      const multiplier = BIN_MULTIPLIERS[s.partNumber] || 1;
      const addedQty = addedBins * multiplier;
      
      const newPdiStock = (Number(s.pdiStock) || 0) + addedQty;
      const newHistory = [...(s.stockHistory || []), { 
        timestamp: time, 
        binCount: addedBins, 
        pdiStock: addedQty, 
        type: 'COMMIT' as const 
      }].slice(-10);

      return { 
        partNumber: s.partNumber, 
        pdiStock: newPdiStock,
        binCount: 0,
        stockHistory: newHistory 
      };
    }).filter(u => u !== null);

    if (updates.length === 0) {
      toast({ title: "No Entry", description: "Enter bin counts before saving." });
      return;
    }

    setStocks(prev => prev.map(s => {
      const update = updates.find(u => u?.partNumber === s.partNumber);
      return update ? { 
        ...s, 
        pdiStock: update.pdiStock,
        binCount: 0,
        stockHistory: update.stockHistory 
      } : s;
    }));

    updates.forEach(up => {
      if (!up) return;
      batch.set(doc(firestore, 'parts', up.partNumber), {
        pdiStock: up.pdiStock,
        binCount: 0,
        stockHistory: up.stockHistory
      }, { merge: true });
    });

    try {
      await batch.commit();
      toast({ title: "Inventory Saved", description: "Stock levels updated and reset." });
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'parts', operation: 'write' }));
    }
  };

  const loadPartToVehicle = (partNumber: string, vehicleKey: VehicleKey, qty: number) => {
    const validatedQty = Math.max(0, qty);
    const existing = stocks.find(s => s.partNumber === partNumber);
    if (!existing) return false;

    const currentlyLoadedTotal = (Number(existing.v1Load) || 0) + (Number(existing.v2Load) || 0) + (Number(existing.v3Load) || 0) + (Number(existing.v4Load) || 0);
    const freeStock = (Number(existing.pdiStock) || 0) - currentlyLoadedTotal;

    if (validatedQty > freeStock) return false;
    
    const updates = { 
      [vehicleKey]: (Number(existing[vehicleKey]) || 0) + validatedQty 
    };
    
    setStocks(prev => prev.map(s => s.partNumber === partNumber ? { ...s, ...updates } : s));
    
    if (user?.role === 'ADMIN' && firestore) {
      setDoc(doc(firestore, 'parts', partNumber), updates, { merge: true })
        .catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `parts/${partNumber}`, operation: 'update', requestResourceData: updates }));
        });
    }
    return true;
  };

  const clearVehicle = (vehicleKey: VehicleKey) => {
    const updatesList: { partNumber: string, updates: any }[] = [];
    const nextStocks = stocks.map(s => {
      const loadQty = Number(s[vehicleKey]) || 0;
      if (loadQty > 0) {
        const updates = { [vehicleKey]: 0 };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    });

    if (updatesList.length === 0) return;

    setStocks(nextStocks);

    if (user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      updatesList.forEach(item => batch.set(doc(firestore, 'parts', item.partNumber), item.updates, { merge: true }));
      batch.commit().catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'parts', operation: 'write' }));
      });
    }
  };

  const dispatchVehicle = (vehicleKey: VehicleKey) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updatesList: { partNumber: string, updates: any }[] = [];
    
    const nextStocks = stocks.map(s => {
      const loadQty = Number(s[vehicleKey]) || 0;
      if (loadQty > 0) {
        const shippedKey = vehicleKey.replace('Load', 'Shipped') as 'v1Shipped' | 'v2Shipped' | 'v3Shipped' | 'v4Shipped';
        const updates = { 
          pdiStock: Math.max(0, (Number(s.pdiStock) || 0) - loadQty),
          shippedQuantity: (Number(s.shippedQuantity) || 0) + loadQty, 
          [shippedKey]: (Number(s[shippedKey]) || 0) + loadQty, 
          [vehicleKey]: 0 
        };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    });

    if (updatesList.length === 0) return;

    setStocks(nextStocks);
    setVehicleStatuses(prev => ({ ...prev, [vehicleKey]: { isDispatched: true, dispatchedAt: time } }));

    if (user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'settings', 'vehicles'), { [vehicleKey]: { isDispatched: true, dispatchedAt: time } }, { merge: true });
      updatesList.forEach(item => batch.set(doc(firestore, 'parts', item.partNumber), item.updates, { merge: true }));
      batch.commit().catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'dispatch', operation: 'write' }));
      });
    }
  };

  const recallVehicle = (vehicleKey: VehicleKey) => {
    const updatesList: { partNumber: string, updates: any }[] = [];
    
    const nextStocks = stocks.map(s => {
      const shippedKey = vehicleKey.replace('Load', 'Shipped') as 'v1Shipped' | 'v2Shipped' | 'v3Shipped' | 'v4Shipped';
      const shippedQty = Number(s[shippedKey]) || 0;
      if (shippedQty > 0) {
        const updates = { 
          pdiStock: (Number(s.pdiStock) || 0) + shippedQty,
          shippedQuantity: Math.max(0, (Number(s.shippedQuantity) || 0) - shippedQty), 
          [shippedKey]: 0,
          [vehicleKey]: shippedQty 
        };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    });

    if (updatesList.length === 0) return;

    setStocks(nextStocks);
    setVehicleStatuses(prev => ({ ...prev, [vehicleKey]: { isDispatched: false, dispatchedAt: null } }));

    if (user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'settings', 'vehicles'), { [vehicleKey]: { isDispatched: false, dispatchedAt: null } }, { merge: true });
      updatesList.forEach(item => batch.set(doc(firestore, 'parts', item.partNumber), item.updates, { merge: true }));
      batch.commit().catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'recall', operation: 'write' }));
      });
    }
  };

  const resetDailyData = async () => {
    if (user?.role !== 'ADMIN' || !firestore) return;
    
    try {
      const batch = writeBatch(firestore);
      
      stocks.forEach(s => {
        const resetUpdates = {
          pdiStock: 0,
          binCount: 0,
          plannedDispatch: 0,
          v1Plan: 0,
          v2Plan: 0,
          v3Plan: 0,
          v4Plan: 0,
          v1Load: 0,
          v2Load: 0,
          v3Load: 0,
          v4Load: 0,
          v1Shipped: 0,
          v2Shipped: 0,
          v3Shipped: 0,
          v4Shipped: 0,
          shippedQuantity: 0,
          planHistory: [],
          stockHistory: []
        };
        batch.set(doc(firestore, 'parts', s.partNumber), resetUpdates, { merge: true });
      });

      batch.set(doc(firestore, 'settings', 'vehicles'), DEFAULT_VEHICLE_STATUSES);
      batch.set(doc(firestore, 'settings', 'system'), { lastReset: new Date().toISOString() }, { merge: true });
      
      await batch.commit();
      
      setStocks(prev => prev.map(s => ({ 
        ...s, 
        pdiStock: 0, binCount: 0,
        plannedDispatch: 0, v1Plan: 0, v2Plan: 0, v3Plan: 0, v4Plan: 0,
        v1Load: 0, v2Load: 0, v3Load: 0, v4Load: 0,
        v1Shipped: 0, v2Shipped: 0, v3Shipped: 0, v4Shipped: 0,
        shippedQuantity: 0, planHistory: [], stockHistory: []
      })));
      setVehicleStatuses(DEFAULT_VEHICLE_STATUSES);
      
      toast({ title: "System Reset", description: "All data cleared successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Reset Failed", description: "Terminal synchronization error." });
    }
  };

  return (
    <AppContext.Provider value={{ 
      stocks, 
      vehicleStatuses, 
      user, 
      login, 
      logout, 
      updateStock, 
      updateBinCount,
      saveStockData,
      loadPartToVehicle, 
      clearVehicle, 
      dispatchVehicle, 
      recallVehicle,
      resetDailyData,
      isLoading, 
      isReadOnly: isReadOnlyState || isPreviewMode, 
      toggleReadOnly,
      isPreviewMode,
      togglePreviewMode,
      theme,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function calculatePartMetrics(stock: PartStock) {
  const availableStock = Number(stock.pdiStock) || 0;
  const planned = Number(stock.plannedDispatch) || 0;
  const shipped = Number(stock.shippedQuantity) || 0;
  const pending = Math.max(0, planned - shipped);
  const balance = availableStock - shipped;
  const shortageQuantity = Math.max(0, planned - availableStock);
  const completionPercentage = planned > 0 ? (shipped / planned) * 100 : 0;
  let status: 'green' | 'yellow' | 'red' = 'green';
  let statusText = "Stock Available";
  if (availableStock < planned && planned > 0) { status = 'red'; statusText = "Stock Not Available"; }
  else if (planned > 0 && Math.abs(availableStock - planned) <= planned * 0.05) { status = 'yellow'; statusText = "Critical Stock"; }
  let completionColor: 'red' | 'yellow' | 'green' = completionPercentage >= 90 ? 'green' : (completionPercentage >= 50 ? 'yellow' : 'red');
  return { pdi: availableStock, availableStock, planned, shipped, pending, balance, shortageQuantity, completionPercentage, completionColor, status, statusText };
}
