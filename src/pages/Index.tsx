import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCheck } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-navy mb-4">
            Kifaru School Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline student management, attendance tracking, and fee collection 
            with our comprehensive school automation platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <CardTitle>Teacher Portal</CardTitle>
              <CardDescription>
                Manage students, record attendance, track fees, and share access with parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/teacher-auth">Access Teacher Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <UserCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle>Parent Portal</CardTitle>
              <CardDescription>
                View your child's attendance records and fee payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/parent-auth">Access Parent Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6">
              <h3 className="font-semibold mb-2">Student Management</h3>
              <p className="text-sm text-muted-foreground">
                Add and manage student records with parent contact information
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold mb-2">Attendance Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Daily attendance recording with real-time parent access
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold mb-2">Fee Management</h3>
              <p className="text-sm text-muted-foreground">
                Track fee payments and generate payment histories
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
