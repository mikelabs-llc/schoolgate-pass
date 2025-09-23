import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ParentAuth = () => {
  const [childUid, setChildUid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'uid' | 'password'>('uid');
  const [studentName, setStudentName] = useState('');
  const { parentAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Pre-fill child UID if provided in URL
  useState(() => {
    const urlChildUid = searchParams.get('uid');
    if (urlChildUid) {
      setChildUid(urlChildUid);
    }
  });

  const handleUidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('Students')
        .select('name')
        .eq('child_uid', childUid)
        .maybeSingle();
      
      if (error || !data) {
        toast({
          title: 'Invalid Child ID',
          description: 'The Child ID you entered does not exist. Please check and try again.',
          variant: 'destructive',
        });
      } else {
        setStudentName(data.name);
        setStep('password');
        toast({
          title: 'Child ID Found',
          description: `Enter the password for ${data.name}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while verifying the Child ID.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await parentAuth(childUid, password);
    
    if (error || !data) {
      toast({
        title: 'Access Denied',
        description: error?.message || 'Invalid password. Please check your credentials.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: `Viewing ${data.name}'s information.`,
      });
      navigate('/parent-dashboard');
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    setStep('uid');
    setPassword('');
    setStudentName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Parent Portal Access</CardTitle>
          <CardDescription>
            {step === 'uid' 
              ? 'Enter your child\'s ID to begin'
              : `Enter password for ${studentName}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'uid' ? (
            <form onSubmit={handleUidSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="childUid">Child ID</Label>
                <Input
                  id="childUid"
                  type="text"
                  value={childUid}
                  onChange={(e) => setChildUid(e.target.value.toUpperCase())}
                  placeholder="e.g. KCS001"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password provided by teacher"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Accessing...' : 'Access Dashboard'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentAuth;