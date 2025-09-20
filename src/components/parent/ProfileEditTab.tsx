import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Camera, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Student {
  id: number;
  name: string;
  class: string;
  child_uid: string;
  parent_email: string;
  parent_phone: string;
  profile_photo_url?: string;
}

interface ProfileChangeRequest {
  id: number;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  new_password: string | null;
  status: string;
  requested_at: string;
  notes: string | null;
}

const profileSchema = z.object({
  parent_name: z.string().optional(),
  parent_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  parent_phone: z.string().optional(),
  new_password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

interface ProfileEditTabProps {
  student: Student;
}

export const ProfileEditTab = ({ student }: ProfileEditTabProps) => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      parent_name: '',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      new_password: '',
    },
  });

  useEffect(() => {
    fetchRequests();
  }, [student.id]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('student_id', student.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      // Check if there's a recent request (within 60 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const recentRequest = requests.find(r => 
        new Date(r.requested_at) > sixtyDaysAgo && r.status === 'approved'
      );

      if (recentRequest) {
        toast({
          title: 'Request Limited',
          description: 'You can only update your profile once every 60 days.',
          variant: 'destructive',
        });
        return;
      }

      const hasChanges = values.parent_name || 
                        values.parent_email !== student.parent_email || 
                        values.parent_phone !== student.parent_phone ||
                        values.new_password;

      if (!hasChanges) {
        toast({
          title: 'No Changes',
          description: 'Please make at least one change to submit a request.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('profile_change_requests')
        .insert([{
          student_id: student.id,
          parent_name: values.parent_name || null,
          parent_email: values.parent_email !== student.parent_email ? values.parent_email : null,
          parent_phone: values.parent_phone !== student.parent_phone ? values.parent_phone : null,
          new_password: values.new_password || null,
          status: 'pending',
        }]);

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your profile change request has been submitted for teacher approval.',
      });

      setDialogOpen(false);
      form.reset();
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit profile change request.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.child_uid}/passport-photo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('passport-photos')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update student record with photo URL
      const { error: updateError } = await supabase
        .from('Students')
        .update({ profile_photo_url: fileName })
        .eq('id', student.id);

      if (updateError) throw updateError;

      toast({
        title: 'Photo Uploaded',
        description: 'Your passport photo has been uploaded successfully.',
      });

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getPhotoUrl = () => {
    if (!student.profile_photo_url) return null;
    
    const { data } = supabase.storage
      .from('passport-photos')
      .getPublicUrl(student.profile_photo_url);
    
    return data.publicUrl;
  };

  const getPendingRequest = () => requests.find(r => r.status === 'pending');
  const pendingRequest = getPendingRequest();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy">Profile Management</h2>
        <p className="text-muted-foreground">Update your contact information and passport photo</p>
      </div>

      {/* Current Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-navy" />
            Current Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-medium">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{student.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Email</p>
                <p className="font-medium">{student.parent_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Phone</p>
                <p className="font-medium">{student.parent_phone || 'Not provided'}</p>
              </div>
              
              {!pendingRequest && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-navy hover:bg-navy-dark text-white">
                      <Edit className="h-4 w-4 mr-2" />
                      Request Profile Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Request Profile Changes</DialogTitle>
                      <DialogDescription>
                        Submit a request to update your contact information. Changes require teacher approval.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="parent_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parent/Guardian Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="parent_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="parent_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+254 700 000 000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="new_password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password (optional)</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-navy hover:bg-navy-dark text-white">
                            Submit Request
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Photo Section */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Passport Photo</p>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {getPhotoUrl() ? (
                      <img 
                        src={getPhotoUrl()!} 
                        alt="Passport photo" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No photo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 2MB • JPG, PNG formats
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Request Alert */}
      {pendingRequest && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700">
            You have a pending profile change request submitted {formatDistanceToNow(new Date(pendingRequest.requested_at), { addSuffix: true })}. 
            Please wait for teacher approval before submitting another request.
          </AlertDescription>
        </Alert>
      )}

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Change Requests</CardTitle>
          <CardDescription>
            Your profile change request history (limited to once every 60 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                        {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm">
                      {request.parent_email && <span className="text-muted-foreground">Email update requested</span>}
                      {request.parent_phone && <span className="text-muted-foreground">, Phone update requested</span>}
                      {request.new_password && <span className="text-muted-foreground">, Password change requested</span>}
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Notes:</span> {request.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No change requests found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};