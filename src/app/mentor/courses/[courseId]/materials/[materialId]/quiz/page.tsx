"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL = "http://localhost:3000/api";

interface QuizOption {
  id?: string;
  label: string;
  text: string;
  is_correct: boolean;
  order: number;
}

interface QuizQuestion {
  id?: string;
  question: string;
  order: number;
  points: number;
  options: QuizOption[];
}

interface Quiz {
  id?: string;
  material_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit: number | null;
  max_attempts: number;
  questions: QuizQuestion[];
}

interface Material {
  id: string;
  title: string;
  type: string;
  section: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

export default function QuizBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.materialId as string;
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [isNewQuiz, setIsNewQuiz] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [quiz, setQuiz] = useState<Quiz>({
    material_id: materialId,
    title: "",
    description: "",
    passing_score: 70,
    time_limit: null,
    max_attempts: 3,
    questions: [],
  });

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  }, []);

  // Fetch material and quiz data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch material info
        const materialRes = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!materialRes.ok) {
          throw new Error("Gagal mengambil data materi");
        }

        const materialData = await materialRes.json();
        setMaterial(materialData);

        // Try to fetch existing quiz
        const quizRes = await fetch(`${API_BASE_URL}/materials/${materialId}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setQuiz(quizData);
          setIsNewQuiz(false);
        } else {
          // No quiz exists, use default
          setQuiz((prev) => ({
            ...prev,
            title: materialData.title || "Quiz",
          }));
          setIsNewQuiz(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Gagal mengambil data quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [materialId, router, getAuthToken]);

  // Add new question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      order: quiz.questions.length,
      points: 1,
      options: [
        { label: "A", text: "", is_correct: true, order: 0 },
        { label: "B", text: "", is_correct: false, order: 1 },
        { label: "C", text: "", is_correct: false, order: 2 },
        { label: "D", text: "", is_correct: false, order: 3 },
      ],
    };

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  // Remove question
  const removeQuestion = (index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })),
    }));
  };

  // Update question text
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  // Update option text
  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optionIndex ? { ...o, text } : o)),
            }
          : q
      ),
    }));
  };

  // Set correct answer
  const setCorrectAnswer = (questionIndex: number, optionLabel: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              options: q.options.map((o) => ({ ...o, is_correct: o.label === optionLabel })),
            }
          : q
      ),
    }));
  };

  // Save quiz
  const handleSave = async () => {
    // Validation
    if (!quiz.title.trim()) {
      alert("Judul quiz harus diisi");
      return;
    }

    if (quiz.questions.length === 0) {
      alert("Minimal harus ada 1 pertanyaan");
      return;
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question.trim()) {
        alert(`Pertanyaan ${i + 1} belum diisi`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        alert(`Pertanyaan ${i + 1} belum memiliki jawaban benar`);
        return;
      }
      const emptyOptions = q.options.filter((o) => !o.text.trim());
      if (emptyOptions.length > 0) {
        alert(`Semua opsi jawaban pertanyaan ${i + 1} harus diisi`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const method = isNewQuiz ? "POST" : "PUT";
      const response = await fetch(`${API_BASE_URL}/materials/${materialId}/quiz`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quiz),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan quiz");
      }

      const savedQuiz = await response.json();
      setQuiz(savedQuiz);
      setIsNewQuiz(false);

      alert("Quiz berhasil disimpan");
    } catch (err) {
      console.error("Error saving quiz:", err);
      alert(err instanceof Error ? err.message : "Gagal menyimpan quiz");
    } finally {
      setSaving(false);
    }
  };

  // Move question
  const moveQuestion = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= quiz.questions.length) return;

    setQuiz((prev) => {
      const newQuestions = [...prev.questions];
      [newQuestions[fromIndex], newQuestions[toIndex]] = [newQuestions[toIndex], newQuestions[fromIndex]];
      return {
        ...prev,
        questions: newQuestions.map((q, i) => ({ ...q, order: i })),
      };
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR", "ADMIN"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat quiz builder...</p>
            </div>
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR", "ADMIN"]}>
      <MentorLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/mentor/courses/${courseId}/sections`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-[#005EB8]" />
                  Quiz Builder
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {material?.section?.course?.title} • {material?.section?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#005EB8] hover:bg-[#004A93]">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Quiz
              </Button>
            </div>
          </div>

          {/* Quiz Info Card */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Judul Quiz</Label>
                <Input
                  value={quiz.title}
                  onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul quiz"
                />
              </div>
              <div>
                <Label>Deskripsi (Opsional)</Label>
                <Textarea
                  value={quiz.description}
                  onChange={(e) => setQuiz((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat tentang quiz ini"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-[#005EB8]">{quiz.questions.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pertanyaan</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{quiz.passing_score}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nilai Lulus</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{quiz.max_attempts}x</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maks Percobaan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Pertanyaan</h2>
              <Button onClick={addQuestion} className="bg-[#005EB8] hover:bg-[#004A93]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pertanyaan
              </Button>
            </div>

            {quiz.questions.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Belum ada pertanyaan</p>
                  <Button onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pertanyaan Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              quiz.questions.map((question, qIndex) => (
                <Card key={qIndex} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Drag handle and number */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveQuestion(qIndex, "up")}
                            disabled={qIndex === 0}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#005EB8] text-white flex items-center justify-center font-bold text-sm">
                          {qIndex + 1}
                        </div>
                      </div>

                      {/* Question content */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label>Pertanyaan</Label>
                          <Textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                            placeholder="Tulis pertanyaan di sini..."
                            rows={2}
                          />
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                                option.is_correct
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setCorrectAnswer(qIndex, option.label)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                  option.is_correct
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                                }`}
                              >
                                {option.label}
                              </button>
                              <Input
                                value={option.text}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                placeholder={`Jawaban ${option.label}`}
                                className="flex-1"
                              />
                              {option.is_correct && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                            </div>
                          ))}
                        </div>

                        {/* Points */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Poin:</Label>
                            <Input
                              type="number"
                              min={1}
                              value={question.points}
                              onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Question Button at bottom */}
          {quiz.questions.length > 0 && (
            <div className="text-center">
              <Button onClick={addQuestion} variant="outline" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pertanyaan Lain
              </Button>
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pengaturan Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nilai Minimum Lulus (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quiz.passing_score}
                  onChange={(e) =>
                    setQuiz((prev) => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Siswa harus mendapatkan minimal {quiz.passing_score}% untuk lulus
                </p>
              </div>

              <div>
                <Label>Batas Waktu (menit)</Label>
                <Input
                  type="number"
                  min={0}
                  value={quiz.time_limit || ""}
                  onChange={(e) =>
                    setQuiz((prev) => ({
                      ...prev,
                      time_limit: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="Kosongkan untuk tanpa batas waktu"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {quiz.time_limit ? `Quiz akan otomatis dikumpulkan setelah ${quiz.time_limit} menit` : "Tidak ada batas waktu"}
                </p>
              </div>

              <div>
                <Label>Maksimal Percobaan</Label>
                <Input
                  type="number"
                  min={1}
                  value={quiz.max_attempts}
                  onChange={(e) =>
                    setQuiz((prev) => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))
                  }
                />
                <p className="text-sm text-gray-500 mt-1">
                  Siswa dapat mencoba quiz maksimal {quiz.max_attempts} kali
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MentorLayout>
    </ProtectedRoute>
  );
}
