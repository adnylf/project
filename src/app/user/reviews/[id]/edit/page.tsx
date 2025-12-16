"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Star,
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  BookOpen,
  User,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    mentor: { user: { full_name: string } };
  };
}

export default function EditReview() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) { setError("Silakan login terlebih dahulu"); return; }
        
        const response = await fetch(`${API_BASE_URL}/users/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Review tidak ditemukan");
        
        const data = await response.json();
        setReview(data.review);
        setRating(data.review.rating);
        setComment(data.review.comment || "");
        setIsAnonymous(data.review.is_anonymous);
      } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
      finally { setLoading(false); }
    };
    
    if (reviewId) fetchReview();
  }, [reviewId, getAuthToken]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment: comment.trim() || null, is_anonymous: isAnonymous }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan review");
      }

      setSuccess("Review berhasil diperbarui");
      setTimeout(() => router.push("/user/reviews"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan review");
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (r: number) => {
    const labels = ["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"];
    return labels[r] || "";
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  if (!review) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error || "Review tidak ditemukan"}</p>
              <Button 
                onClick={() => router.push("/user/reviews")} 
                variant="outline"
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Review Saya
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Back Button - Style diubah seperti button Lihat Semua di dashboard */}
          <Button 
            variant="outline" 
            onClick={() => router.push("/user/reviews")} 
            className="gap-2 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Review Saya
          </Button>

          {/* Course Info */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  {review.course.thumbnail ? (
                    <img
                      src={review.course.thumbnail}
                      alt={review.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-[#005EB8]" />
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{review.course.title}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <p className="text-sm">{review.course.mentor.user.full_name}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Ditinjau pada {new Date(review.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {success && (
            <Card className="rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-green-600 dark:text-green-400">{success}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">Edit Review</CardTitle>
              <CardDescription>Perbarui review Anda untuk kursus ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating */}
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white">Rating</Label>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-10 w-10 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "text-[#F4B400] fill-[#F4B400]"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getRatingLabel(hoverRating || rating)}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-gray-900 dark:text-white">Komentar (Opsional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bagikan pengalaman Anda mengikuti kursus ini..."
                  rows={5}
                  className="resize-none border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  maxLength={1000}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.length}/1000 karakter
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sisa {1000 - comment.length} karakter
                  </p>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#005EB8]/10 rounded-lg">
                    {isAnonymous ? 
                      <EyeOff className="h-5 w-5 text-[#005EB8]" /> : 
                      <Eye className="h-5 w-5 text-[#005EB8]" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Review Anonim</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isAnonymous ? "Nama Anda tidak akan ditampilkan" : "Review akan menampilkan nama Anda"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isAnonymous} 
                  onCheckedChange={setIsAnonymous}
                  className="data-[state=checked]:bg-[#005EB8]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/user/reviews")} 
                  className="flex-1 border-gray-300 dark:border-gray-600"
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-[#005EB8] hover:bg-[#004A93]" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}