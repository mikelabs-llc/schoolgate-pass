import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Copy, Send, ExternalLink, Mail, MessageSquare } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  class: string;
  parent_email: string | null;
  parent_phone: string | null;
  child_uid: string | null;
  parent_password: string | null;
  access_url: string | null;
}

export const URLSharingTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('Students')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${description} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const sendEmail = (student: Student) => {
    if (!student.parent_email || !student.access_url) {
      toast({
        title: 'Cannot send email',
        description: 'Parent email or access URL not available',
        variant: 'destructive',
      });
      return;
    }

    const subject = encodeURIComponent(`Access to ${student.name}'s School Records`);
    const body = encodeURIComponent(`Dear Parent,

You can now access ${student.name}'s school records including attendance and fee payments using the link below.

Access Link: ${student.access_url}

Login Credentials:
Child ID: ${student.child_uid}
Password: ${student.parent_password}

Please keep these credentials secure and do not share them with others.

Best regards,
School Administration`);

    window.open(`mailto:${student.parent_email}?subject=${subject}&body=${body}`);
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.parent_phone || !student.access_url) {
      toast({
        title: 'Cannot send WhatsApp',
        description: 'Parent phone number or access URL not available',
        variant: 'destructive',
      });
      return;
    }

    const message = encodeURIComponent(`Hello! You can now access ${student.name}'s school records:

🔗 Link: ${student.access_url}
🆔 Child ID: ${student.child_uid}
🔐 Password: ${student.parent_password}

View attendance and fee payments anytime. Keep credentials secure.`);

    // Remove any non-numeric characters from phone number
    const cleanPhone = student.parent_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`);
  };

  const getCredentialsText = (student: Student) => {
    return `Child ID: ${student.child_uid}\nPassword: ${student.parent_password}\nLink: ${student.access_url}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">URL Sharing</h2>
        <p className="text-muted-foreground">
          Share parent access links and credentials with parents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Students</CardTitle>
          <CardDescription>
            Find students to share their parent access credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by student name or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent Access Management</CardTitle>
          <CardDescription>
            Share login credentials and access links with parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.parent_email || 'No email'}</div>
                      <div className="text-muted-foreground">
                        {student.parent_phone || 'No phone'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.child_uid && student.parent_password ? (
                      <div className="space-y-1">
                        <div className="text-xs">
                          <strong>ID:</strong> <code className="bg-muted px-1 rounded">{student.child_uid}</code>
                        </div>
                        <div className="text-xs">
                          <strong>Pass:</strong> <code className="bg-muted px-1 rounded">{student.parent_password}</code>
                        </div>
                        {student.access_url && (
                          <div className="text-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs"
                              onClick={() => window.open(student.access_url!, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Link
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          getCredentialsText(student),
                          'Access credentials'
                        )}
                        disabled={!student.child_uid || !student.parent_password}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {student.parent_email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendEmail(student)}
                          disabled={!student.access_url}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {student.parent_phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsApp(student)}
                          disabled={!student.access_url}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {searchTerm ? 'No students match your search.' : 'No students found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Share Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <Copy className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Copy Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Copy the child ID, password, and link to share manually
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Send Email</h3>
              <p className="text-sm text-muted-foreground">
                Send a formatted email with access credentials to parents
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">WhatsApp Message</h3>
              <p className="text-sm text-muted-foreground">
                Send access details via WhatsApp to parent's phone number
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};