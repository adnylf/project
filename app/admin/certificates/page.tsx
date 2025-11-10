'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Upload,
  Star
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Data dummy
const certificateTemplates = [
  {
    id: 1,
    name: 'Template Standar',
    description: 'Template sertifikat default untuk semua kursus',
    category: 'General',
    isDefault: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-06-20',
    usageCount: 1250
  },
  {
    id: 2,
    name: 'Template Programming',
    description: 'Khusus untuk kursus programming dan coding',
    category: 'Programming',
    isDefault: false,
    createdAt: '2024-02-10',
    updatedAt: '2024-08-15',
    usageCount: 890
  },
  {
    id: 3,
    name: 'Template Design',
    description: 'Untuk kursus design dan kreatif',
    category: 'Design',
    isDefault: false,
    createdAt: '2024-03-05',
    updatedAt: '2024-07-30',
    usageCount: 420
  },
  {
    id: 4,
    name: 'Template Business',
    description: 'Khusus kursus bisnis dan manajemen',
    category: 'Business',
    isDefault: false,
    createdAt: '2024-04-20',
    updatedAt: '2024-09-10',
    usageCount: 320
  }
];

const issuedCertificates = [
  {
    id: 'CERT-2024-001',
    user: 'Ahmad Fauzi',
    course: 'Web Development Basics',
    mentor: 'Ahmad Hidayat',
    issueDate: '2024-10-15',
    expirationDate: '2025-10-15',
    status: 'active',
    template: 'Template Standar',
    certificateUrl: '/certificates/ahmad-fauzi-web-dev.pdf'
  },
  {
    id: 'CERT-2024-002',
    user: 'Sarah Putri',
    course: 'JavaScript Advanced',
    mentor: 'Sarah Johnson',
    issueDate: '2024-10-14',
    expirationDate: '2025-10-14',
    status: 'active',
    template: 'Template Programming',
    certificateUrl: '/certificates/sarah-putri-js-advanced.pdf'
  },
  {
    id: 'CERT-2024-003',
    user: 'John Smith',
    course: 'UI/UX Design Fundamentals',
    mentor: 'Maria Garcia',
    issueDate: '2024-10-13',
    expirationDate: '2025-10-13',
    status: 'revoked',
    template: 'Template Design',
    certificateUrl: '/certificates/john-smith-uiux.pdf'
  },
  {
    id: 'CERT-2024-004',
    user: 'Maria Chen',
    course: 'Python Data Science',
    mentor: 'David Lee',
    issueDate: '2024-10-12',
    expirationDate: '2025-10-12',
    status: 'active',
    template: 'Template Programming',
    certificateUrl: '/certificates/maria-chen-python.pdf'
  },
  {
    id: 'CERT-2024-005',
    user: 'David Lee',
    course: 'Mobile App Development',
    mentor: 'Robert Brown',
    issueDate: '2024-10-11',
    expirationDate: '2025-10-11',
    status: 'expired',
    template: 'Template Standar',
    certificateUrl: '/certificates/david-lee-mobile.pdf'
  },
  {
    id: 'CERT-2024-006',
    user: 'Lisa Wang',
    course: 'Cloud Computing',
    mentor: 'Emily Davis',
    issueDate: '2024-10-10',
    expirationDate: '2025-10-10',
    status: 'active',
    template: 'Template Standar',
    certificateUrl: '/certificates/lisa-wang-cloud.pdf'
  }
];

export default function AdminCertificates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [activeTab, setActiveTab] = useState('templates');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#008A00]">Aktif</Badge>;
      case 'revoked':
        return <Badge className="bg-[#D93025]">Dicabut</Badge>;
      case 'expired':
        return <Badge className="bg-[#F4B400]">Kadaluarsa</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDefaultBadge = (isDefault: boolean) => {
    if (isDefault) {
      return <Badge className="bg-[#005EB8]">Default</Badge>;
    }
    return null;
  };

  const filteredCertificates = issuedCertificates.filter((cert) => {
    const matchesSearch = 
      cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesTemplate = filterTemplate === 'all' || cert.template === filterTemplate;
    
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const handleSetDefaultTemplate = (templateId: number) => {
    console.log(`Set default template: ${templateId}`);
    // API call: PUT /api/admin/certificates/set-default
  };

  const handleEditTemplate = (templateId: number) => {
    console.log(`Edit template: ${templateId}`);
    // API call: GET /api/admin/certificates/templates/:id
  };

  const handleDeleteTemplate = (templateId: number) => {
    console.log(`Delete template: ${templateId}`);
    // API call: DELETE /api/admin/certificates/templates/:id
  };

  const handleRevokeCertificate = (certificateId: string) => {
    console.log(`Revoke certificate: ${certificateId}`);
    // API call: POST /api/certificates/:id/revoke
  };

  const handleDownloadCertificate = (certificateUrl: string) => {
    console.log(`Download certificate: ${certificateUrl}`);
    // Implement download functionality
  };

  const handleUploadTemplate = () => {
    console.log('Upload new template');
    // Implement upload functionality
  };

  const stats = {
    totalTemplates: certificateTemplates.length,
    totalIssued: issuedCertificates.length,
    activeCertificates: issuedCertificates.filter(c => c.status === 'active').length,
    revokedCertificates: issuedCertificates.filter(c => c.status === 'revoked').length
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Certificates Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Template dan sertifikat yang dikeluarkan
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              className="bg-[#005EB8] hover:bg-[#004A93]"
              onClick={handleUploadTemplate}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Template
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTemplates}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Template</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-[#008A00]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalIssued}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sertifikat Dikeluarkan</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[#008A00]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeCertificates}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktif</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#D93025]/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-[#D93025]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.revokedCertificates}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dicabut</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardContent className="p-0">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === 'templates'
                      ? 'border-[#005EB8] text-[#005EB8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Template Sertifikat
                </button>
                <button
                  onClick={() => setActiveTab('issued')}
                  className={`px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === 'issued'
                      ? 'border-[#005EB8] text-[#005EB8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Sertifikat Dikeluarkan
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'templates' ? (
                <div className="space-y-6">
                  {/* Template Cards Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificateTemplates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md ${
                          template.isDefault 
                            ? 'border-[#005EB8] ring-1 ring-[#005EB8]' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-[#005EB8]" />
                            </div>
                            {getDefaultBadge(template.isDefault)}
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {template.description}
                          </p>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Kategori</span>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Digunakan</span>
                              <span className="font-medium">{template.usageCount} kali</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Update</span>
                              <span className="text-gray-500">
                                {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6">
                            {!template.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-gray-300 dark:border-gray-600"
                                onClick={() => handleSetDefaultTemplate(template.id)}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Set Default
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={() => handleEditTemplate(template.id)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDownloadCertificate(`/templates/${template.id}.pdf`)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!template.isDefault && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="text-[#D93025]"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search and Filter for Certificates */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Cari ID sertifikat, user, atau kursus..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="revoked">Dicabut</SelectItem>
                          <SelectItem value="expired">Kadaluarsa</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Template</SelectItem>
                          {certificateTemplates.map(template => (
                            <SelectItem key={template.id} value={template.name}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Certificates Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Sertifikat</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Kursus</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Tanggal Keluar</TableHead>
                          <TableHead>Kadaluarsa</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCertificates.map((certificate) => (
                          <TableRow key={certificate.id} className="table-row">
                            <TableCell className="font-mono text-sm">
                              {certificate.id}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {certificate.user}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {certificate.course}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {certificate.mentor}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(certificate.issueDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(certificate.expirationDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {certificate.template}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(certificate.status)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadCertificate(certificate.certificateUrl)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Lihat Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {certificate.status === 'active' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleRevokeCertificate(certificate.id)}
                                      className="text-[#D93025]"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cabut Sertifikat
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredCertificates.length === 0 && (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Award className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Tidak ada sertifikat ditemukan
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Coba ubah filter atau kata kunci pencarian
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}