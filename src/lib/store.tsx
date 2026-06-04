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

export interface PlanRevision {
  timestamp: string;
  quantity: number;
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
  v1Load: number;
  v2Load: number;
  v3Load: number;
  v1Shipped: number;
  v2Shipped: number;
  v3Shipped: number;
  shippedQuantity: number;
  planHistory: PlanRevision[];
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

interface AppState {
  stocks: PartStock[];
  vehicleStatuses: Record<string, VehicleStatus>;
  user: UserProfile | null;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  updateStock: (partNumber: string, updates: Partial<PartStock>) => void;
  updateBinCount: (partNumber: string, binCount: number) => void;
  loadPartToVehicle: (partNumber: string, vehicleKey: 'v1Load' | 'v2Load' | 'v3Load', qty: number) => boolean;
  clearVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
  dispatchVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
  recallVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
  isLoading: boolean;
  isReadOnly: boolean;
  toggleReadOnly: () => void;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const DEFAULT_VEHICLE_STATUSES: Record<string, VehicleStatus> = {
  v1Load: { isDispatched: false, dispatchedAt: null },
  v2Load: { isDispatched: false, dispatchedAt: null },
  v3Load: { isDispatched: false, dispatchedAt: null },
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
  v1Load: 0,
  v2Load: 0,
  v3Load: 0,
  v1Shipped: 0,
  v2Shipped: 0,
  v3Shipped: 0,
  shippedQuantity: 0,
  planHistory: []
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
  
  const firestore = useFirestore();

  useEffect(() => {
    setHasMounted(true);
    const savedUser = localStorage.getItem('dispatch_user');
    const cachedStocks = localStorage.getItem('cached_factory_stocks');
    const cachedVehicles = localStorage.getItem('cached_vehicle_status');

    if (cachedStocks) {
      try {
        const parsed = JSON.parse(cachedStocks);
        if (parsed && parsed.length > 0) {
          setStocks(parsed);
          setIsLoading(false);
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
        const remoteData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        if (remoteData.length === 0) return prev;

        const next = prev.map(localPart => {
          const remotePart = remoteData.find(rp => rp.partNumber === localPart.partNumber);
          // Prioritize non-zero fields from remote while maintaining other local fields
          if (remotePart) {
            return {
              ...localPart,
              ...remotePart,
            };
          }
          return localPart;
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
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `parts/${partNumber}`, operation: 'update', requestResourceData: updates }));
        });
    }
  };

  const updateBinCount = (partNumber: string, binCount: number) => {
    const multiplier = BIN_MULTIPLIERS[partNumber] || 1;
    const totalStock = binCount * multiplier;
    const updates = { binCount, pdiStock: totalStock };
    
    setStocks(prev => prev.map(s => s.partNumber === partNumber ? { ...s, ...updates } : s));
    
    if (user?.role === 'ADMIN' && firestore) {
      setDoc(doc(firestore, 'parts', partNumber), updates, { merge: true })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `parts/${partNumber}`, operation: 'update', requestResourceData: updates }));
        });
    }
  };

  const loadPartToVehicle = (partNumber: string, vehicleKey: 'v1Load' | 'v2Load' | 'v3Load', qty: number) => {
    const existing = stocks.find(s => s.partNumber === partNumber);
    if (!existing || Number(existing.pdiStock) < qty) return false;
    const updates = { 
      pdiStock: Number(existing.pdiStock) - qty, 
      [vehicleKey]: (Number(existing[vehicleKey]) || 0) + qty 
    };
    setStocks(prev => prev.map(s => s.partNumber === partNumber ? { ...s, ...updates } : s));
    if (user?.role === 'ADMIN' && firestore) {
      setDoc(doc(firestore, 'parts', partNumber), updates, { merge: true })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `parts/${partNumber}`, operation: 'update', requestResourceData: updates }));
        });
    }
    return true;
  };

  const clearVehicle = (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => {
    const updatesList: { partNumber: string, updates: any }[] = [];
    setStocks(prev => prev.map(s => {
      const loadQty = Number(s[vehicleKey]) || 0;
      if (loadQty > 0) {
        const updates = { pdiStock: Number(s.pdiStock) + loadQty, [vehicleKey]: 0 };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    }));
    if (updatesList.length > 0 && user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      updatesList.forEach(item => batch.update(doc(firestore, 'parts', item.partNumber), item.updates));
      batch.commit().catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'parts', operation: 'write' }));
      });
    }
  };

  const dispatchVehicle = (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    const updatesList: { partNumber: string, updates: any }[] = [];
    
    setStocks(prev => prev.map(s => {
      const loadQty = Number(s[vehicleKey]) || 0;
      if (loadQty > 0) {
        const shippedKey = { v1Load: 'v1Shipped' as const, v2Load: 'v2Shipped' as const, v3Load: 'v3Shipped' as const }[vehicleKey];
        const newShippedVal = (Number(s[shippedKey]) || 0) + loadQty;
        const newTotalShipped = (Number(s.shippedQuantity) || 0) + loadQty;
        const updates = { 
          shippedQuantity: newTotalShipped, 
          [shippedKey]: newShippedVal, 
          [vehicleKey]: 0 
        };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    }));

    setVehicleStatuses(prev => ({ ...prev, [vehicleKey]: { isDispatched: true, dispatchedAt: time } }));

    if (user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'settings', 'vehicles'), { [vehicleKey]: { isDispatched: true, dispatchedAt: time } }, { merge: true });
      updatesList.forEach(item => batch.update(doc(firestore, 'parts', item.partNumber), item.updates));
      batch.commit().catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'dispatch', operation: 'write' }));
      });
    }
  };

  const recallVehicle = (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => {
    const updatesList: { partNumber: string, updates: any }[] = [];
    setStocks(prev => prev.map(s => {
      const shippedKey = { v1Load: 'v1Shipped' as const, v2Load: 'v2Shipped' as const, v3Load: 'v3Shipped' as const }[vehicleKey];
      const shippedQty = Number(s[shippedKey]) || 0;
      if (shippedQty > 0) {
        const newShippedQuantity = Math.max(0, (Number(s.shippedQuantity) || 0) - shippedQty);
        const updates = { 
          shippedQuantity: newShippedQuantity, 
          [shippedKey]: 0, 
          pdiStock: Number(s.pdiStock) + shippedQty 
        };
        updatesList.push({ partNumber: s.partNumber, updates });
        return { ...s, ...updates };
      }
      return s;
    }));
    setVehicleStatuses(prev => ({ ...prev, [vehicleKey]: { isDispatched: false, dispatchedAt: null } }));
    if (user?.role === 'ADMIN' && firestore) {
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'settings', 'vehicles'), { [vehicleKey]: { isDispatched: false, dispatchedAt: null } }, { merge: true });
      updatesList.forEach(item => batch.update(doc(firestore, 'parts', item.partNumber), item.updates));
      batch.commit().catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'recall', operation: 'write' }));
      });
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
      loadPartToVehicle, 
      clearVehicle, 
      dispatchVehicle, 
      recallVehicle, 
      isLoading, 
      isReadOnly: isReadOnlyState || isPreviewMode, 
      toggleReadOnly,
      isPreviewMode,
      togglePreviewMode
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
