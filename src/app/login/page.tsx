
'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Briefcase, Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const { login } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(userId, password);
    if (!success) {
      setError('Invalid User ID or Password. System access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-[#1e293b] rounded-2xl mb-4 border border-white/5 shadow-2xl">
            <Briefcase className="w-10 h-10 text-[#3b82f6]" />
          </div>
          <h1 className="font-headline text-3xl font-black tracking-[0.2em] text-white uppercase leading-none">
            Kalyani
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">
            DISPATCH STOCK TRACKER
          </p>
        </div>

        <Card className="bg-[#0a0f1c] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5 py-4">
            <CardTitle className="text-center font-headline font-black uppercase text-base tracking-widest text-white">
              System Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-500 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[10px] font-black uppercase tracking-widest">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest ml-1">USER IDENTIFICATION</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    type="text" 
                    placeholder="ENTER USER ID" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="pl-10 bg-black/40 border-white/10 h-12 font-black uppercase text-sm tracking-widest focus-visible:ring-primary rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest ml-1">SECURE ACCESS KEY</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    type="password" 
                    placeholder="ENTER PASSWORD" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-black/40 border-white/10 h-12 font-black uppercase text-sm tracking-widest focus-visible:ring-primary rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg mt-4">
                AUTHENTICATE
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[8px] text-slate-600 font-black uppercase tracking-widest">
          Authorized Access Only • Factory Management Portal
        </p>
      </div>
    </div>
  );
}
