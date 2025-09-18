import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserCheck } from 'lucide-react';

const ParentAuth = () => {
  const [childUid, setChildUid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await parentAuth(childUid, password);
    
    if (error || !data) {
      toast({
        title: 'Access Denied',
        description: 'Invalid Child ID or password. Please check your credentials.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: `Viewing ${data.name}'s information.`,
      });
      // Store student data in session storage for parent dashboard
      sessionStorage.setItem('parentStudentData', JSON.stringify(data));
      navigate('/parent-dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Parent Portal Access</CardTitle>
          <CardDescription>Enter your child's ID and password to view their information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="childUid">Child ID</Label>
              <Input
                id="childUid"
                type="text"
                value={childUid}
                onChange={(e) => setChildUid(e.target.value)}
                placeholder="Enter child's unique ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password provided by teacher"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accessing...' : 'Access Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentAuth;