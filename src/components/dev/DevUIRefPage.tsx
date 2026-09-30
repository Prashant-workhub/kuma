import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  RadioGroupItem,
  FormField,
  Badge,
  StatusPill,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Section,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SegmentedControl,
  Breadcrumbs,
  PageHeader,
  Toolbar,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  ConfirmDialog,
  useToast,
  ToastProvider,
  Tooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  ProgressBar,
  Skeleton,
  Spinner,
  EmptyState,
  ErrorState,
  InlineAlert,
  Stat,
  Avatar,
} from '../ui';
import { useTheme } from '../../theme/theme';
import { Sun, Moon, Search, SlidersHorizontal, Plus, User, Mail, Folder } from 'lucide-react';

export const DevUIRefPageContent: React.FC = () => {
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('buttons');
  const [segmentedValue, setSegmentedValue] = useState('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-page text-text-primary p-6 md:p-10 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header & Theme Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-text-primary tracking-tight">Kuma Design Primitives</h1>
              <Badge variant="info">Living Reference</Badge>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Dev-only catalog of calm, professional enterprise UI components. Current Theme: <strong className="font-semibold text-text-primary capitalize">{theme}</strong>.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={toggle} aria-label="Toggle visual theme">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
          </Button>
        </div>

        {/* Page Header Component Example */}
        <PageHeader
          title="Shared Component Reference"
          description="Every interactive component below is token-driven, fully accessible, and supports light & dark themes."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Developer', href: '/dev/ui' },
            { label: 'Component Catalog' },
          ]}
          primaryAction={
            <Button variant="primary" size="md" onClick={() => toast.success('New action item created')}>
              <Plus className="h-4 w-4" />
              <span>Create item</span>
            </Button>
          }
          secondaryActions={
            <Button variant="secondary" size="md" onClick={() => toast.info('Filters updated')}>
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          }
        />

        {/* Component Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="buttons">Buttons & Actions</TabsTrigger>
            <TabsTrigger value="forms">Form Controls</TabsTrigger>
            <TabsTrigger value="data">Data & Tables</TabsTrigger>
            <TabsTrigger value="overlays">Dialogs & Overlays</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Alerts</TabsTrigger>
          </TabsList>

          {/* BUTTONS TAB */}
          <TabsContent value="buttons">
            <Section title="Buttons" description="Primary, secondary, ghost, danger variants in small and medium sizes.">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants & States</CardTitle>
                  <CardDescription>Includes standard buttons, icon-only buttons with aria-label, and loading states.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {/* Standard Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" onClick={() => toast.success('Saved changes successfully')}>Primary</Button>
                    <Button variant="secondary" onClick={() => toast.info('Settings opened')}>Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger" onClick={() => setConfirmOpen(true)}>Danger action</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                    <Button variant="primary" isLoading>Loading</Button>
                  </div>

                  {/* Small Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Small primary</Button>
                    <Button variant="secondary" size="sm">Small secondary</Button>
                    <Button variant="ghost" size="sm">Small ghost</Button>
                    <Button variant="danger" size="sm">Small danger</Button>
                  </div>

                  {/* Icon Only Buttons */}
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" isIconOnly aria-label="Search items">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="primary" isIconOnly aria-label="Add item">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" isIconOnly aria-label="User profile">
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Section>
          </TabsContent>

          {/* FORMS TAB */}
          <TabsContent value="forms">
            <Section title="Form Controls" description="Inputs, Textarea, Select, Checkbox, RadioGroup, and Switch controls inside FormField wrappers.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Text Inputs & Selects</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FormField label="Full Name" helpText="Enter your official registered name." required>
                      <Input placeholder="e.g. Jane Doe" />
                    </FormField>

                    <FormField label="Work Email" errorText="Please enter a valid enterprise email address.">
                      <Input placeholder="jane.doe@acme.com" hasError />
                    </FormField>

                    <FormField label="Department" required>
                      <Select
                        options={[
                          { value: 'eng', label: 'Engineering' },
                          { value: 'hr', label: 'Human Resources' },
                          { value: 'ops', label: 'Operations' },
                        ]}
                      />
                    </FormField>

                    <FormField label="Bio / Notes">
                      <Textarea placeholder="Brief notes about your role..." />
                    </FormField>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Selection & Toggles</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold text-text-secondary">Checkboxes</span>
                      <Checkbox label="Send email notifications for course updates" defaultChecked />
                      <Checkbox label="Opt-in to weekly performance summary report" />
                      <Checkbox label="Disabled option" disabled />
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold text-text-secondary">Switches</span>
                      <Switch label="Enable automatic data synchronization" defaultChecked />
                      <Switch label="Dark mode high contrast mode" />
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold text-text-secondary">Radio Group</span>
                      <RadioGroup defaultValue="weekly">
                        <RadioGroupItem value="daily" label="Daily updates" />
                        <RadioGroupItem value="weekly" label="Weekly digest" />
                        <RadioGroupItem value="monthly" label="Monthly summary" />
                      </RadioGroup>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-secondary">Segmented Control</span>
                      <SegmentedControl
                        options={[
                          { value: 'grid', label: 'Grid view' },
                          { value: 'list', label: 'List view' },
                          { value: 'table', label: 'Table view' },
                        ]}
                        value={segmentedValue}
                        onChange={setSegmentedValue}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Section>
          </TabsContent>

          {/* DATA TAB */}
          <TabsContent value="data">
            <Section title="Data Views & Metrics" description="Tables, badges, status pills, stats, and search toolbars.">
              <Toolbar
                search={<Input placeholder="Search records..." className="h-9" />}
                filters={
                  <Select
                    sizeVariant="sm"
                    options={[
                      { value: 'all', label: 'All roles' },
                      { value: 'trainee', label: 'Trainees' },
                      { value: 'trainer', label: 'Trainers' },
                    ]}
                  />
                }
                actions={
                  <Button variant="secondary" size="sm">Export CSV</Button>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Total Enrolled Trainees" value="1,248" delta={{ value: '+12%', direction: 'up' }} />
                <Stat label="Average Assessment Score" value="84.2%" delta={{ value: '-2.1%', direction: 'down' }} />
                <Stat label="Active Published Courses" value="28" delta={{ value: 'Unchanged', direction: 'unchanged' }} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise Data Table</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead sortable sortDirection="asc">Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Competency</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name="Alex Rivers" size="sm" />
                            <div>
                              <div className="font-medium text-text-primary">Alex Rivers</div>
                              <div className="text-xs text-text-secondary">alex.rivers@acme.com</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>Trainee</TableCell>
                        <TableCell><StatusPill status="in_progress" /></TableCell>
                        <TableCell><Badge variant="neutral">Data Cleaning L2</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name="David Chen" size="sm" />
                            <div>
                              <div className="font-medium text-text-primary">David Chen</div>
                              <div className="text-xs text-text-secondary">david.chen@acme.com</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>Trainer</TableCell>
                        <TableCell><StatusPill status="passed" /></TableCell>
                        <TableCell><Badge variant="success">SQL Advanced L4</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={page}
                    totalPages={5}
                    totalItems={42}
                    pageSize={10}
                    onPageChange={setPage}
                  />
                </CardContent>
              </Card>
            </Section>
          </TabsContent>

          {/* OVERLAYS TAB */}
          <TabsContent value="overlays">
            <Section title="Dialogs & Overlays" description="Modals, side drawers, confirmation prompts, tooltips, and dropdown menus.">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Modals & Menus</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" onClick={() => setDialogOpen(true)}>Open Dialog Modal</Button>
                  <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Side Drawer</Button>
                  <Button variant="danger" onClick={() => setConfirmOpen(true)}>Open Confirm Modal</Button>

                  <Tooltip content="Provides additional context on hover">
                    <Button variant="ghost">Hover for Tooltip</Button>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary">Dropdown Menu</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => toast.info('Profile selected')}>View profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Settings selected')}>Account settings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-danger" onClick={() => toast.error('Signed out')}>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>

              {/* Dialog Modal instance */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile Information</DialogTitle>
                    <DialogDescription>Update your registered enterprise details below.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-2">
                    <FormField label="Full Name"><Input defaultValue="Jane Doe" /></FormField>
                    <FormField label="Job Title"><Input defaultValue="Senior Analyst" /></FormField>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={() => { toast.success('Profile saved'); setDialogOpen(false); }}>Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Drawer instance */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-text-primary">Resource Details Drawer</h3>
                  <p className="text-xs text-text-secondary">Side drawer panel for inspecting additional module metadata and resource details.</p>
                  <InlineAlert variant="info" title="Offline Availability">
                    This module resource is cached for offline access.
                  </InlineAlert>
                </div>
              </Drawer>

              {/* Confirm Dialog instance */}
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete Course Module"
                description="Are you sure you want to delete this module? This action cannot be undone."
                confirmText="Delete module"
                isDanger
                onConfirm={() => {
                  toast.error('Module deleted');
                  setConfirmOpen(false);
                }}
              />
            </Section>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback">
            <Section title="Feedback & Indicators" description="Progress bars, inline alerts, empty states, error states, and skeleton loaders.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress & Loaders</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-secondary">Progress Bar (65%)</span>
                      <ProgressBar value={65} showLabel />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-secondary">Spinners</span>
                      <div className="flex items-center gap-4">
                        <Spinner size={16} />
                        <Spinner size={20} />
                        <Spinner size={24} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-secondary">Skeleton Loader</span>
                      <Skeleton className="h-6 w-3/4 rounded-sm" />
                      <Skeleton className="h-4 w-1/2 rounded-sm" />
                      <Skeleton className="h-4 w-5/6 rounded-sm" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inline Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <InlineAlert variant="info" title="System Maintenance">
                      Scheduled database optimization will occur on Sunday at 02:00 UTC.
                    </InlineAlert>
                    <InlineAlert variant="warning" title="Assessment Window Closing">
                      You have 2 hours remaining to complete your assigned competency test.
                    </InlineAlert>
                    <InlineAlert variant="danger" title="Connection Interrupted">
                      Unable to sync offline outbox queue. Please check your network connection.
                    </InlineAlert>
                    <InlineAlert variant="success" title="Certificate Verified">
                      Your course completion certificate was validated cryptographically.
                    </InlineAlert>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <EmptyState
                  icon={<Folder className="h-8 w-8" />}
                  title="No assigned courses found"
                  description="You are currently caught up with all required organization learning tracks."
                  action={<Button variant="primary" size="sm">Explore catalog</Button>}
                />

                <ErrorState
                  title="Failed to load analytics"
                  description="The analytics service timed out while fetching performance metrics."
                  onRetry={() => toast.info('Retrying connection...')}
                />
              </div>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export const DevUIRefPage: React.FC = () => {
  return (
    <ToastProvider>
      <DevUIRefPageContent />
    </ToastProvider>
  );
};

export default DevUIRefPage;
