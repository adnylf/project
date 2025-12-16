'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  Loader2,
  FolderTree,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryDialog } from '@/components/modal/categories-modal';

const API_BASE_URL = 'http://localhost:3000/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    courses: number;
  };
}

interface CategoryForm {
  name: string;
  description: string;
  parent_id: string;
  order: number;
  is_active: boolean;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: '',
    order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  
  // SweetAlert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setAlertConfig({
          type: "error",
          title: "Error",
          message: 'Silakan login terlebih dahulu'
        });
        setShowAlert(true);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kategori');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get parent categories (categories without parent)
  const parentCategories = categories.filter(c => !c.parent_id);

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      order: categories.length,
      is_active: true,
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      order: category.order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  // Handle form field change
  const handleFormChange = (field: keyof CategoryForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save category
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setAlertConfig({
        type: "error",
        title: "Error",
        message: "Nama kategori wajib diisi"
      });
      setShowAlert(true);
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      const payload = {
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        order: formData.order,
        is_active: formData.is_active,
      };

      const url = editingCategory
        ? `${API_BASE_URL}/admin/categories/${editingCategory.id}`
        : `${API_BASE_URL}/admin/categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan kategori');
      }

      await fetchCategories();
      setDialogOpen(false);
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: editingCategory ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan"
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menyimpan kategori'
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const toggleActive = async (category: Category) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengubah status kategori');
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: `Kategori ${!category.is_active ? "diaktifkan" : "dinonaktifkan"}`
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal mengubah status'
      });
      setShowAlert(true);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteAlert(true);
  };

  // Delete category
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus kategori');
      }

      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: "Kategori berhasil dihapus"
      });
      setShowAlert(true);
      
      setShowDeleteAlert(false);
      setCategoryToDelete(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Gagal menghapus kategori'
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.is_active).length,
    inactive: categories.filter((c) => !c.is_active).length,
    withCourses: categories.filter((c) => (c._count?.courses || 0) > 0).length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data kategori...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout>
        {/* SweetAlert Component untuk notifikasi biasa */}
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={3000}
          showCloseButton={true}
        />

        {/* SweetAlert untuk konfirmasi hapus kategori */}
        <SweetAlert
          type="error"
          title="Hapus Kategori?"
          message={
            categoryToDelete 
              ? `Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.name}"?`
              : ""
          }
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {categoryToDelete && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Trash2 className="h-6 w-6 text-[#D93025]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {categoryToDelete.name}
                  </p>
                  {categoryToDelete._count?.courses && categoryToDelete._count.courses > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Memiliki {categoryToDelete._count.courses} kursus
                    </p>
                  )}
                </div>
              </div>
              
              {categoryToDelete._count?.courses && categoryToDelete._count.courses > 0 ? (
                <div className="p-3 bg-[#F4B400]/10 border border-[#F4B400]/20 rounded-lg mb-4">
                  <p className="text-sm text-[#F4B400] dark:text-[#F4B400]">
                    Kategori ini memiliki {categoryToDelete._count.courses} kursus.
                    {categoryToDelete._count.courses > 0 && (
                      <span className="block mt-1">
                        Tidak dapat dihapus. Pindahkan atau hapus kursus terlebih dahulu.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-[#D93025] dark:text-[#D93025] mb-4">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              )}
            </div>
          )}
          
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteAlert(false)}
              disabled={deleting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || (categoryToDelete?._count?.courses || 0) > 0}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#B71C1C] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
            >
              {deleting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <FolderTree className="h-8 w-8 text-[#005EB8]" />
                Manajemen Kategori
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola kategori kursus platform
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="bg-[#005EB8] hover:bg-[#004A93] text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Kategori
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <FolderTree className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kategori</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Eye className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <EyeOff className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Non-aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <BookOpen className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dengan Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari kategori berdasarkan nama atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:bg-gray-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">Daftar Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderTree className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? "Kategori tidak ditemukan" : "Belum ada kategori"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Mulai dengan menambahkan kategori pertama"}
                  </p>
                  <Button onClick={openCreateDialog} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Nama</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Slug</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Parent</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Kursus</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr
                          key={category.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {category.parent && (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">
                              {category.slug}
                            </code>
                          </td>
                          <td className="py-4 px-4">
                            {category.parent ? (
                              <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                                {category.parent.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">
                              {category._count?.courses || 0}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {/* Button Eye Aktif/Tidak Aktif */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(category)}
                              className={
                                category.is_active
                                  ? "border-[#008A00] text-[#008A00] hover:bg-[#008A00]/10 dark:border-[#008A00] dark:text-[#008A00]"
                                  : "border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10 dark:border-[#D93025] dark:text-[#D93025]"
                              }
                            >
                              {category.is_active ? (
                                <Eye className="h-5 w-5" />
                              ) : (
                                <EyeOff className="h-5 w-5" />
                              )}
                            </Button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(category)}
                                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                                onClick={() => openDeleteDialog(category)}
                                disabled={(category._count?.courses || 0) > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Dialog (Create/Edit) */}
          <CategoryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingCategory={editingCategory}
            parentCategories={parentCategories}
            formData={formData}
            loading={saving}
            onFormChange={handleFormChange}
            onSave={handleSave}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}