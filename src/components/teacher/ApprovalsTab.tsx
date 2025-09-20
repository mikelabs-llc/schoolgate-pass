import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProfileChangeRequest {
  id: number;
  student_id: number;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  new_password: string | null;
  status: string;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  Students?: {
    name: string;
    class: string;
    parent_email: string;
  } | null;
}

export const ApprovalsTab = () => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          Students (
            name,
            class,
            parent_email
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch approval requests.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: new Date().toISOString(),
        notes: notes || null,
      };

      // If approving, update the student's actual information
      if (action === 'approve') {
        const studentUpdates: any = {};
        
        if (selectedRequest.parent_name) {
          // Note: We might need to add a parent_name field to Students table
          // For now, we'll skip this field
        }
        
        if (selectedRequest.parent_email) {
          studentUpdates.parent_email = selectedRequest.parent_email;
        }
        
        if (selectedRequest.parent_phone) {
          studentUpdates.parent_phone = selectedRequest.parent_phone;
        }
        
        if (selectedRequest.new_password) {
          studentUpdates.parent_password = selectedRequest.new_password;
        }

        // Update the student record
        if (Object.keys(studentUpdates).length > 0) {
          const { error: studentError } = await supabase
            .from('Students')
            .update(studentUpdates)
            .eq('id', selectedRequest.student_id);

          if (studentError) throw studentError;
        }
      }

      // Update the request status
      const { error } = await supabase
        .from('profile_change_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} request.`,
        variant: 'destructive',
      });
    }
  };

  const openActionDialog = (request: ProfileChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes('');
    setDialogOpen(true);
  };

  const getPendingCount = () => requests.filter(r => r.status === 'pending').length;
  const getApprovedCount = () => requests.filter(r => r.status === 'approved').length;
  const getRejectedCount = () => requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-pulse text-navy mx-auto mb-4" />
          <p className="text-muted-foreground">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy">Parent Profile Change Approvals</h2>
        <p className="text-muted-foreground">Review and approve parent credential change requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{getPendingCount()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{getApprovedCount()}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{getRejectedCount()}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-navy" />
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Change Requests</CardTitle>
          <CardDescription>
            Parent profile change requests require approval (limited to once every 60 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current Email</TableHead>
                <TableHead>Requested Changes</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.Students?.name}</p>
                      <p className="text-sm text-muted-foreground">{request.Students?.class}</p>
                    </div>
                  </TableCell>
                  <TableCell>{request.Students?.parent_email}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {request.parent_name && (
                        <p><span className="font-medium">Name:</span> {request.parent_name}</p>
                      )}
                      {request.parent_email && (
                        <p><span className="font-medium">Email:</span> {request.parent_email}</p>
                      )}
                      {request.parent_phone && (
                        <p><span className="font-medium">Phone:</span> {request.parent_phone}</p>
                      )}
                      {request.new_password && (
                        <p><span className="font-medium">Password:</span> ••••••••</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                      className={
                        request.status === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                        request.status === 'pending' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                        ''
                      }
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => openActionDialog(request, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openActionDialog(request, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        {request.approved_at && (
                          <> • {formatDistanceToNow(new Date(request.approved_at), { addSuffix: true })}</>
                        )}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {requests.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No change requests found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Change Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will update the parent\'s profile with the new information.'
                : 'This will reject the change request.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Student: {selectedRequest.Students?.name}</h4>
                <p className="text-sm text-muted-foreground">Class: {selectedRequest.Students?.class}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Requested Changes:</h4>
                <div className="space-y-1 text-sm bg-muted p-3 rounded">
                  {selectedRequest.parent_name && (
                    <p><span className="font-medium">New Name:</span> {selectedRequest.parent_name}</p>
                  )}
                  {selectedRequest.parent_email && (
                    <p><span className="font-medium">New Email:</span> {selectedRequest.parent_email}</p>
                  )}
                  {selectedRequest.parent_phone && (
                    <p><span className="font-medium">New Phone:</span> {selectedRequest.parent_phone}</p>
                  )}
                  {selectedRequest.new_password && (
                    <p><span className="font-medium">Password:</span> Will be updated</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes about this decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(actionType)}
                  className={
                    actionType === 'approve'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};