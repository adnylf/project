// app/user/transactions/[id]/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share, 
  X, 
  Receipt,
  CreditCard,
  Building,
  CheckCircle,
  Clock,
  User
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import { useParams } from "next/navigation";

// Data transaksi yang sama dengan halaman list
const transactions = [
  {
    id: "TRX-2024-001",
    courseName: "Full-Stack Web Development",
    amount: 499000,
    status: "completed",
    paymentMethod: "Credit Card",
    date: "2024-09-15",
    progress: 65,
    materialsAccessed: 12,
    canRefund: true,
    invoice: "/invoices/TRX-2024-001.pdf",
    paymentDetails: {
      cardNumber: "**** **** **** 1234",
      bankName: "BCA",
      paymentTime: "2024-09-15 14:30:25"
    }
  },
  {
    id: "TRX-2024-002",
    courseName: "Data Science dengan Python",
    amount: 599000,
    status: "completed",
    paymentMethod: "Bank Transfer",
    date: "2024-08-10",
    progress: 25,
    materialsAccessed: 5,
    canRefund: true,
    invoice: "/invoices/TRX-2024-002.pdf",
    paymentDetails: {
      accountNumber: "123-456-789",
      bankName: "Mandiri",
      paymentTime: "2024-08-10 09:15:42"
    }
  },
  {
    id: "TRX-2024-003",
    courseName: "Digital Marketing Fundamentals",
    amount: 399000,
    status: "pending",
    paymentMethod: "E-Wallet",
    date: "2024-10-05",
    progress: 0,
    materialsAccessed: 0,
    canRefund: false,
    invoice: null,
    paymentDetails: {
      walletType: "Gopay",
      paymentTime: "2024-10-05 16:20:15"
    }
  },
  {
    id: "TRX-2024-004",
    courseName: "UI/UX Design Mastery",
    amount: 549000,
    status: "completed",
    paymentMethod: "Credit Card",
    date: "2024-07-20",
    progress: 90,
    materialsAccessed: 13,
    canRefund: false,
    invoice: "/invoices/TRX-2024-004.pdf",
    paymentDetails: {
      cardNumber: "**** **** **** 5678",
      bankName: "BNI",
      paymentTime: "2024-07-20 11:45:30"
    }
  },
  {
    id: "TRX-2024-005",
    courseName: "Mobile App Development",
    amount: 699000,
    status: "refunded",
    paymentMethod: "Bank Transfer",
    date: "2024-09-01",
    refundDate: "2024-09-08",
    progress: 10,
    materialsAccessed: 2,
    canRefund: false,
    invoice: "/invoices/TRX-2024-005.pdf",
    paymentDetails: {
      accountNumber: "987-654-321",
      bankName: "BRI",
      paymentTime: "2024-09-01 13:20:10"
    }
  },
  {
    id: "TRX-2024-006",
    courseName: "Machine Learning Professional",
    amount: 799000,
    status: "failed",
    paymentMethod: "Credit Card",
    date: "2024-10-01",
    progress: 0,
    materialsAccessed: 0,
    canRefund: false,
    invoice: null,
    paymentDetails: {
      cardNumber: "**** **** **** 9012",
      bankName: "BCA",
      paymentTime: "2024-10-01 10:05:22"
    }
  },
];

const organizationInfo = {
  name: "EduPlatform Indonesia",
  address: "Jl. Teknologi No. 123, Jakarta Selatan",
  phone: "+62 21 1234 5678",
  email: "info@eduplatform.com",
  website: "www.eduplatform.com"
};

// Data tambahan untuk detail transaksi
const transactionDetails: any = {
  "TRX-2024-001": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "8 jam",
      instructor: "Dr. Ahmad Fauzi",
      category: "Programming",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      cardNumber: "**** **** **** 1234",
      bankName: "BCA",
      paymentTime: "2024-09-15 14:30:25",
      transactionFee: 7500,
      totalAmount: 506500
    }
  },
  "TRX-2024-002": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "10 jam",
      instructor: "Dr. Maria Chen",
      category: "Data Science",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      accountNumber: "123-456-789",
      bankName: "Mandiri",
      paymentTime: "2024-08-10 09:15:42",
      transactionFee: 6500,
      totalAmount: 605500
    }
  },
  "TRX-2024-003": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "6 jam",
      instructor: "Rina Wijaya",
      category: "Marketing",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      walletType: "Gopay",
      paymentTime: "2024-10-05 16:20:15",
      transactionFee: 3000,
      totalAmount: 402000
    }
  },
  "TRX-2024-004": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "7 jam",
      instructor: "Budi Santoso",
      category: "Design",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      cardNumber: "**** **** **** 5678",
      bankName: "BNI",
      paymentTime: "2024-07-20 11:45:30",
      transactionFee: 8200,
      totalAmount: 557200
    }
  },
  "TRX-2024-005": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "9 jam",
      instructor: "Alex Johnson",
      category: "Programming",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      accountNumber: "987-654-321",
      bankName: "BRI",
      paymentTime: "2024-09-01 13:20:10",
      transactionFee: 7000,
      totalAmount: 706000
    }
  },
  "TRX-2024-006": {
    studentName: "John Doe",
    studentEmail: "john.doe@email.com",
    courseDetails: {
      duration: "12 jam",
      instructor: "Dr. Maria Chen",
      category: "Machine Learning",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      cardNumber: "**** **** **** 9012",
      bankName: "BCA",
      paymentTime: "2024-10-01 10:05:22",
      transactionFee: 9000,
      totalAmount: 808000
    }
  }
};

export default function TransactionDetail() {
  const params = useParams();
  const transactionId = params.id as string;

  // Cari transaksi berdasarkan ID
  const baseTransaction = transactions.find(trx => trx.id === transactionId);
  
  // Jika transaksi tidak ditemukan
  if (!baseTransaction) {
    return (
      <UserLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <Link href="/user/transaction">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transaksi Tidak Ditemukan
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                ID: {transactionId}
              </p>
            </div>
          </div>
          
          <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Receipt className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Transaksi tidak ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Transaksi dengan ID {transactionId} tidak ditemukan dalam sistem.
                  </p>
                </div>
                <Link href="/user/transaction">
                  <Button className="mt-4">
                    Kembali ke Daftar Transaksi
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  // Gabungkan data base dengan detail tambahan
  const detailData = transactionDetails[transactionId];
  const transaction = {
    ...baseTransaction,
    ...detailData,
    studentName: detailData?.studentName || "John Doe",
    studentEmail: detailData?.studentEmail || "john.doe@email.com",
    courseDetails: detailData?.courseDetails || {
      duration: "8 jam",
      instructor: "Instruktur",
      category: "Kursus",
      accessPeriod: "Lifetime"
    },
    paymentDetails: {
      ...baseTransaction.paymentDetails,
      ...detailData?.paymentDetails
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadInvoice = () => {
    if (transaction.invoice) {
      console.log(`Downloading invoice for transaction: ${transactionId}`);
      // Simulasi download
      const link = document.createElement('a');
      link.href = transaction.invoice;
      link.download = `invoice-${transaction.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Invoice tidak tersedia untuk transaksi ini');
    }
  };

  const handleShareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: `Struk Transaksi ${transaction.id}`,
        text: `Struk pembelian kursus ${transaction.courseName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link struk telah disalin ke clipboard!');
    }
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "completed":
        return <div className="flex items-center gap-2 text-green-300">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">LUNAS</span>
        </div>;
      case "pending":
        return <div className="flex items-center gap-2 text-yellow-300">
          <Clock className="h-5 w-5" />
          <span className="font-semibold">PENDING</span>
        </div>;
      case "refunded":
        return <div className="flex items-center gap-2 text-blue-300">
          <Receipt className="h-5 w-5" />
          <span className="font-semibold">REFUND</span>
        </div>;
      case "failed":
        return <div className="flex items-center gap-2 text-red-300">
          <X className="h-5 w-5" />
          <span className="font-semibold">GAGAL</span>
        </div>;
      default:
        return null;
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/user/transaction">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detail Transaksi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {transaction.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleShareReceipt}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Bagikan
            </Button>
            <Button
              onClick={handleDownloadInvoice}
              className="bg-[#005EB8] hover:bg-[#004A93] flex items-center gap-2"
              disabled={!transaction.invoice}
            >
              <Download className="h-4 w-4" />
              Unduh PDF
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Receipt Card */}
          <div className="lg:col-span-2">
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-8 w-8" />
                    <div>
                      <h2 className="text-2xl font-bold">STRUK TRANSAKSI</h2>
                      <p className="text-blue-100">EduPlatform Indonesia</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge()}
                    <p className="text-blue-100 text-sm">{transaction.id}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Transaction Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Informasi Transaksi
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tanggal</span>
                        <span className="font-medium">{formatDate(transaction.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Waktu</span>
                        <span className="font-medium">{transaction.paymentDetails.paymentTime.split(' ')[1]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`font-medium ${
                          transaction.status === 'completed' ? 'text-[#008A00]' :
                          transaction.status === 'pending' ? 'text-[#F4B400]' :
                          transaction.status === 'refunded' ? 'text-[#005EB8]' :
                          'text-[#D93025]'
                        }`}>
                          {transaction.status === 'completed' ? 'Berhasil' :
                           transaction.status === 'pending' ? 'Pending' :
                           transaction.status === 'refunded' ? 'Refund' : 'Gagal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Informasi Pembayaran
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Metode</span>
                        <span className="font-medium">{transaction.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bank</span>
                        <span className="font-medium">{transaction.paymentDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {transaction.paymentMethod === 'Credit Card' ? 'No. Kartu' : 'No. Rekening'}
                        </span>
                        <span className="font-medium">
                          {transaction.paymentDetails.cardNumber || transaction.paymentDetails.accountNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Detail Kursus
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {transaction.courseName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Oleh: {transaction.courseDetails.instructor}
                        </p>
                      </div>
                      <span className="font-bold text-[#005EB8]">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{transaction.courseDetails.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{transaction.courseDetails.category}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Rincian Pembayaran
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Harga Kursus</span>
                      <span>{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Biaya Transaksi</span>
                      <span>{formatCurrency(transaction.paymentDetails.transactionFee || 0)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#005EB8]">
                        {formatCurrency(transaction.paymentDetails.totalAmount || transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Informasi Pelanggan
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Nama</p>
                      <p className="font-medium">{transaction.studentName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium">{transaction.studentEmail}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization Info */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-[#005EB8] to-[#004A93] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {organizationInfo.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>{organizationInfo.address}</p>
                    <p>{organizationInfo.phone}</p>
                    <p>{organizationInfo.email}</p>
                    <p>{organizationInfo.website}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tindakan Cepat
                </h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleDownloadInvoice}
                    disabled={!transaction.invoice}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Unduh Invoice
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleShareReceipt}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Bagikan Struk
                  </Button>
                  <Link href="/user/courses" className="w-full">
                    <Button className="w-full justify-start" variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Akses Kursus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Support Info */}
            <Card className="rounded-lg border bg-gradient-to-br from-[#008A00] to-[#006600] text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Butuh Bantuan?</h3>
                <p className="text-white/90 text-sm mb-4">
                  Hubungi tim support kami untuk pertanyaan terkait transaksi
                </p>
                <div className="space-y-2 text-sm">
                  <p>📧 support@eduplatform.com</p>
                  <p>📞 +62 21 1234 5678</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Note */}
        <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Struk ini merupakan bukti pembayaran yang sah. Simpan untuk keperluan referensi.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Dicetak pada: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}