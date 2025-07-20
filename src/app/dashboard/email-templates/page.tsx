"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronRight,
  Variable,
  MoreHorizontal
} from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Define available variables
const emailVariables = [
  { key: '[client_first_name]', label: 'Client First Name', description: 'First name of the client' },
  { key: '[client_last_name]', label: 'Client Last Name', description: 'Last name of the client' },
  { key: '[client_phone]', label: 'Client Phone', description: 'Phone number of the client' },
  { key: '[job_title]', label: 'Job Title', description: 'Title of the job position' },
  { key: '[job_company]', label: 'Job Company', description: 'Company offering the job' },
  { key: '[recruiter_name]', label: 'Recruiter Name', description: 'Name of the recruiter' },
];

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchTemplates();
    }
  }, [user?.id]);

  const fetchTemplates = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load templates');
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body: ''
    });
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
  };

  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(false);
    setIsCreating(false);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body: ''
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    try {
      if (isCreating) {
        // Create new template
        const { data, error } = await supabase
          .from('email_templates')
          .insert([{
            user_id: user!.id,
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            is_default: false
          }])
          .select()
          .single();

        if (error) throw error;
        
        toast.success('Template created successfully');
        setIsCreating(false);
        setSelectedTemplate(data);
      } else if (isEditing && selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        
        toast.success('Template updated successfully');
        setIsEditing(false);
      }

      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    } else {
      toast.success('Template deleted successfully');
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
        setIsCreating(false);
      }
      await fetchTemplates();
    }
  };

  const handleEditorInit = (evt: any, editor: any) => {
    console.log('TinyMCE editor initialized:', editor);
    setEditorLoaded(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Variable copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const VariablesPanel = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Variable className="w-5 h-5" />
          Available Variables
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click any variable to copy it to your clipboard
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {emailVariables.map((variable) => (
            <div
              key={variable.key}
              className="flex items-center justify-between p-2 rounded-md border hover:bg-accent cursor-pointer transition-colors group"
              onClick={() => copyToClipboard(variable.key)}
              title={variable.description}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-primary">{variable.key}</p>
                <p className="text-xs text-muted-foreground truncate">{variable.label}</p>
              </div>
              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!user?.id) {
    return (
      <div className="container mx-auto py-10 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to manage your email templates.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading email templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Email Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your email templates for job applications
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Templates List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Templates ({templates.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No templates yet</p>
                  <p className="text-sm">Create your first template to get started</p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleViewTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-base leading-tight">{template.name}</h3>
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(template.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Variables Panel - Always visible */}
          <VariablesPanel />
        </div>

        {/* Right Column - Template Form/View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTemplate || isCreating ? (
            <>
              {/* Template Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="w-5 h-5" />
                      {isCreating ? 'New Template' : isEditing ? 'Edit Template' : 'Template Details'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isEditing || isCreating ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEditTemplate(selectedTemplate!)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Template Name */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Template Name
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing || isCreating ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter template name..."
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium">{formData.name}</p>
                  )}
                </CardContent>
              </Card>

              {/* Email Subject */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5" />
                    Email Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing || isCreating ? (
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Enter email subject..."
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium">{formData.subject}</p>
                  )}
                </CardContent>
              </Card>

              {/* Email Body */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5" />
                    Email Body
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing || isCreating ? (
                    <>
                      {!editorLoaded && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading rich text editor...
                        </div>
                      )}
                      <Editor
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={formData.body}
                        onEditorChange={(content) => setFormData({ ...formData, body: content })}
                        onInit={handleEditorInit}
                        init={{
                          height: 400,
                          menubar: false,
                          plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code help wordcount'
                          ],
                          toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.6; }',
                          placeholder: 'Write your email template here...'
                        }}
                      />
                      {!editorLoaded && (
                        <textarea
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          placeholder="Write your email template here..."
                          className="w-full h-96 p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mt-3"
                        />
                      )}
                    </>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.body }}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a template from the list to view its details, or create a new one.
                  </p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 