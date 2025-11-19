// app/user/courses/[id]/discussion/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft,
  MessageSquare,
  Send,
  ThumbsUp,
  User,
  Calendar,
  Search
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import { useParams } from "next/navigation";

const discussions = [
  {
    id: 1,
    user: {
      name: "Ahmad Fauzi",
      role: "Mentor",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    message: "Selamat datang di sesi diskusi! Silakan ajukan pertanyaan terkait materi yang belum dipahami. Saya siap membantu Anda.",
    timestamp: "2 hari yang lalu",
    likes: 8,
    isMentor: true
  },
  {
    id: 2,
    user: {
      name: "Sari Indah",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
    },
    message: "Mau tanya, untuk membuat layout yang responsive, lebih baik menggunakan Flexbox atau CSS Grid?",
    timestamp: "1 hari yang lalu",
    likes: 5,
    isMentor: false,
    replies: [
      {
        id: 1,
        user: {
          name: "Ahmad Fauzi",
          role: "Mentor",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        },
        message: "Kedua teknik memiliki kegunaannya masing-masing. Flexbox lebih cocok untuk layout satu dimensi (baris atau kolom), sedangkan CSS Grid ideal untuk layout dua dimensi.",
        timestamp: "20 jam yang lalu",
        likes: 3,
        isMentor: true
      }
    ]
  },
  {
    id: 3,
    user: {
      name: "Budi Santoso",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    message: "Bagaimana cara terbaik untuk memulai project website pertama? Apakah langsung menggunakan framework seperti React atau belajar vanilla JavaScript dulu?",
    timestamp: "12 jam yang lalu",
    likes: 7,
    isMentor: false
  }
];

export default function CourseDiscussion() {
  const params = useParams();
  const id = params.id;
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDiscussions = discussions.filter(discussion =>
    discussion.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle send message logic here
      console.log("New message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/user/courses/${id}/player`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Kembali ke Kelas
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Diskusi dengan Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ajukan pertanyaan dan diskusikan materi pembelajaran
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Discussion List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
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

            {/* Discussion Threads */}
            <div className="space-y-4">
              {filteredDiscussions.map((discussion) => (
                <Card key={discussion.id} className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={discussion.user.avatar}
                          alt={discussion.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {discussion.user.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            discussion.isMentor
                              ? "bg-[#008A00] bg-opacity-20 text-[#008A00]"
                              : "bg-[#005EB8] bg-opacity-20 text-[#005EB8]"
                          }`}>
                            {discussion.user.role}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {discussion.timestamp}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {discussion.message}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            Balas
                          </Button>
                        </div>

                        {/* Replies */}
                        {discussion.replies && (
                          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                            {discussion.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3 pt-4">
                                <img
                                  src={reply.user.avatar}
                                  alt={reply.user.name}
                                  className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                      {reply.user.name}
                                    </h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      reply.isMentor
                                        ? "bg-[#008A00] bg-opacity-20 text-[#008A00]"
                                        : "bg-[#005EB8] bg-opacity-20 text-[#005EB8]"
                                    }`}>
                                      {reply.user.role}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {reply.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {reply.message}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 flex items-center gap-1">
                                      <ThumbsUp className="h-3 w-3" />
                                      <span className="text-xs">{reply.likes}</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mentor Info & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mentor Card */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
                    alt="Mentor"
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    Dr. Ahmad Fauzi
                  </h3>
                  <p className="text-sm text-[#008A00] mb-2">Senior Web Developer</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    10+ tahun pengalaman dalam web development dan pendidikan teknologi
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-bold text-[#005EB8]">4.8</p>
                      <p className="text-gray-600 dark:text-gray-400">Rating</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-bold text-[#005EB8]">1.2k</p>
                      <p className="text-gray-600 dark:text-gray-400">Siswa</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
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
                    <span>Gunakan format code block untuk kode yang panjang</span>
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

        {/* New Message Input */}
        <Card className="rounded-lg border border-gray-200 dark:border-gray-700 sticky bottom-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Ketik pertanyaan atau komentar Anda..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="mb-2"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tekan Enter untuk mengirim
                  </p>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-[#005EB8] hover:bg-[#004A93]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}