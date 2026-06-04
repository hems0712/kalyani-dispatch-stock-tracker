
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Log for developer context
      console.warn('Firestore Permission Denied:', error.context);
      
      // Show user feedback
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: `You do not have permission to perform this action (${error.context.operation}).`,
      });

      // In development, we throw to show the rich error overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
