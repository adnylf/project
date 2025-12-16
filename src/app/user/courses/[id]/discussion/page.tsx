"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft,
  MessageSquare,
  Send,
  ThumbsUp,
  Calendar,
  Search,
  Loader2,
  Reply,
  MoreHorizontal,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE_URL = "http://localhost:3000/api";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user: User;
  parent_id: string | null;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

interface Course {
  id: string;
  title: string;
  mentor: {
    id: string;
    user: User;
  };
}

export default function CourseDiscussion() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  // Get current user from token
  const getCurrentUser = useCallback(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  // Fetch course and comments
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      // Fetch course details
      const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!courseResponse.ok) {
        throw new Error("Gagal mengambil data kursus");
      }

      const courseResult = await courseResponse.json();
      setCourse(courseResult.data || courseResult.course || courseResult);

      // Fetch comments for this course (via materials or direct course comments)
      // Using general comments endpoint filtered by course
      const commentsResponse = await fetch(
        `${API_BASE_URL}/courses/${courseId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (commentsResponse.ok) {
        const commentsResult = await commentsResponse.json();
        setComments(commentsResult.comments || commentsResult.data || []);
      } else {
        // Fallback: try to get comments from materials
        setComments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [courseId, getAuthToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter comments by search term
  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Post new comment
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      const token = getAuthToken();

      // For course-level discussions, we might need a general material or course comment endpoint
      // Using a generic approach here - adjust based on actual API structure
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim komentar");
      }

      const result = await response.json();
      const newComment = result.comment || result.data;

      // Add to local state
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
      }

      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  };

  // Post reply
  const handleSendReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parent_id: parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim balasan");
      }

      const result = await response.json();
      const newReply = result.comment || result.data;

      // Add reply to local state
      if (newReply) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            return comment;
          })
        );
      }

      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim balasan");
    } finally {
      setSubmitting(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Check if user is mentor
  const isMentor = (userId: string) => {
    return course?.mentor?.user?.id === userId;
  };

  const currentUser = getCurrentUser();

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat diskusi...</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "MENTOR", "ADMIN"]}>
      <UserLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div>
            {/* Button Kembali ke Kelas - Style diubah seperti button Lihat Semua di dashboard */}
            <Button 
              variant="outline" 
              onClick={() => window.history.back()} 
              className="gap-2 mb-4 border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali ke Kelas
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-[#005EB8]" />
              Diskusi dengan Mentor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{course?.title || "Memuat..."}</p>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Discussion List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Cari dalam diskusi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* New Message Input (Top) */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {currentUser?.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.full_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Ketik pertanyaan atau komentar Anda..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tekan tombol Kirim untuk mengirim pesan
                        </p>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || submitting}
                          className="bg-[#005EB8] hover:bg-[#004A93]"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Kirim
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discussion Threads */}
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Belum ada diskusi
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Jadilah yang pertama memulai diskusi!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredComments.map((comment) => (
                    <Card
                      key={comment.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {comment.user.avatar_url ? (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user.full_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {comment.user.full_name}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  isMentor(comment.user.id)
                                    ? "bg-[#008A00] bg-opacity-20 text-[#008A00]"
                                    : "bg-[#005EB8] bg-opacity-20 text-[#005EB8]"
                                }`}
                              >
                                {isMentor(comment.user.id) ? "Mentor" : "Student"}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimeAgo(comment.created_at)}
                              </span>
                              {comment.is_edited && (
                                <span className="text-xs text-gray-400">(diedit)</span>
                              )}
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                              {comment.content}
                            </p>

                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(comment.id)}
                              >
                                <Reply className="h-4 w-4 mr-1" />
                                Balas
                              </Button>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                              <Card className="mt-4 ml-4 border-gray-200 dark:border-gray-700">
                                <CardContent className="p-4">
                                  <Textarea
                                    placeholder="Tulis balasan..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="mb-2"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSendReply(comment.id)}
                                      disabled={!replyContent.trim() || submitting}
                                      size="sm"
                                      className="bg-[#005EB8] hover:bg-[#004A93]"
                                    >
                                      {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Kirim Balasan"
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent("");
                                      }}
                                    >
                                      Batal
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                                {comment.replies.map((reply) => (
                                  <Card key={reply.id} className="border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-4">
                                      <div className="flex gap-3">
                                        {reply.user.avatar_url ? (
                                          <img
                                            src={reply.user.avatar_url}
                                            alt={reply.user.full_name}
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                              {reply.user.full_name}
                                            </h4>
                                            <span
                                              className={`px-2 py-0.5 text-xs rounded-full ${
                                                isMentor(reply.user.id)
                                                  ? "bg-[#008A00] bg-opacity-20 text-[#008A00]"
                                                  : "bg-[#005EB8] bg-opacity-20 text-[#005EB8]"
                                              }`}
                                            >
                                              {isMentor(reply.user.id) ? "Mentor" : "Student"}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {formatTimeAgo(reply.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {reply.content}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Mentor Info & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Mentor Card */}
              {course?.mentor && (
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="text-center">
                      {course.mentor.user.avatar_url ? (
                        <img
                          src={course.mentor.user.avatar_url}
                          alt={course.mentor.user.full_name}
                          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                          <UserIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {course.mentor.user.full_name}
                      </h3>
                      <p className="text-sm text-[#008A00] mb-2">Mentor</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Tips Bertanya
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-[#005EB8] mt-0.5 flex-shrink-0" />
                      <span>Jelaskan masalah dengan spesifik dan sertakan kode jika perlu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-[#005EB8] mt-0.5 flex-shrink-0" />
                      <span>Sebutkan materi atau video yang terkait dengan pertanyaan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-[#005EB8] mt-0.5 flex-shrink-0" />
                      <span>Sebutkan langkah-langkah yang sudah dicoba</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}