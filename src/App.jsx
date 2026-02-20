import React, { useState, useEffect } from 'react';
import { Sparkles, Moon, Sun, Star, BookOpen, Heart, Briefcase, Coins, Activity, AlertCircle, Loader2 } from 'lucide-react';

// --- Configuration & Constants ---
const apiKey = "AIzaSyAjFNACzqACCeVbG78NJNkx7AwSvTMUljg"; // The execution environment provides the key at runtime.

const TOPICS = [
  { id: 'general', label: 'ภาพรวมชีวิต', icon: BookOpen },
  { id: 'love', label: 'ความรักและคู่ครอง', icon: Heart },
  { id: 'work', label: 'การงานและอาชีพ', icon: Briefcase },
  { id: 'finance', label: 'การเงินและโชคลาภ', icon: Coins },
  { id: 'health', label: 'สุขภาพร่างกาย', icon: Activity },
];

// --- Utility Functions ---

// คำนวณราศีตามหลักโหราศาสตร์ไทย (โดยประมาณ)
const calculateThaiZodiac = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-12

  if ((month === 1 && day >= 15) || (month === 2 && day <= 12)) return 'มังกร';
  if ((month === 2 && day >= 13) || (month === 3 && day <= 14)) return 'กุมภ์';
  if ((month === 3 && day >= 15) || (month === 4 && day <= 12)) return 'มีน';
  if ((month === 4 && day >= 13) || (month === 5 && day <= 14)) return 'เมษ';
  if ((month === 5 && day >= 15) || (month === 6 && day <= 14)) return 'พฤษภ';
  if ((month === 6 && day >= 15) || (month === 7 && day <= 14)) return 'เมถุน';
  if ((month === 7 && day >= 15) || (month === 8 && day <= 15)) return 'กรกฎ';
  if ((month === 8 && day >= 16) || (month === 9 && day <= 16)) return 'สิงห์';
  if ((month === 9 && day >= 17) || (month === 10 && day <= 16)) return 'กันย์';
  if ((month === 10 && day >= 17) || (month === 11 && day <= 15)) return 'ตุลย์';
  if ((month === 11 && day >= 16) || (month === 12 && day <= 15)) return 'พิจิก';
  if ((month === 12 && day >= 16) || (month === 1 && day <= 14)) return 'ธนู';

  return '';
};

// ฟังก์ชันเรียก API พร้อมระบบ Retry
const fetchWithRetry = async (prompt, maxRetries = 5) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{
        text: "คุณคือ 'แม่หมอ' ผู้มีญานทิพย์และเชี่ยวชาญด้านโหราศาสตร์ไทยโบราณ จงทำนายดวงชะตาด้วยน้ำเสียงที่อบอุ่น เป็นกันเองเหมือนญาติผู้ใหญ่ที่มีความเมตตา แต่แฝงไปด้วยความขลังและความแม่นยำ ใช้คำแทนตัวเองว่า 'แม่หมอ' และเรียกผู้รับคำทำนายว่า 'ลูกดวง' หรือ 'เจ้าชะตา' ให้คำแนะนำที่ลึกซึ้ง สละสลวย เข้าใจง่าย และนำไปปฏิบัติได้จริง ห้ามใช้คำหยาบคาย และหลีกเลี่ยงการทำนายเรื่องความตายหรือโรคร้ายแรงเกินจริง"
      }]
    }
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Detailed:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่สามารถอ่านคำทำนายได้ในขณะนี้";
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default function App() {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    gender: '',
    age: '',
    dob: ''
  });
  const [zodiac, setZodiac] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
  const [prediction, setPrediction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // อัปเดตราศีอัตโนมัติเมื่อเปลี่ยนวันเกิด
  useEffect(() => {
    if (formData.dob) {
      setZodiac(calculateThaiZodiac(formData.dob));
    } else {
      setZodiac('');
    }
  }, [formData.dob]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "กรุณากรอกชื่อ-นามสกุล";
    if (!formData.nickname.trim()) return "กรุณากรอกชื่อเล่น";
    if (!formData.gender) return "กรุณาระบุเพศ";
    if (!formData.age || isNaN(formData.age) || parseInt(formData.age) <= 0) return "กรุณากรอกอายุให้ถูกต้อง";
    if (!formData.dob) return "กรุณาเลือกวันเดือนปีเกิด";
    return null;
  };

  const handlePredict = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsLoading(true);
    setPrediction('');

    const topicLabel = TOPICS.find(t => t.id === selectedTopic)?.label || 'ภาพรวมชีวิต';

    // จัดรูปแบบวันที่ให้อ่านง่าย
    const dobObj = new Date(formData.dob);
    const formattedDob = dobObj.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const prompt = `
      จงทำนายดวงชะตาของบุคคลนี้อย่างละเอียด (ประมาณ 2-3 ย่อหน้า) ในเรื่อง: ${topicLabel}
      
      ข้อมูลผู้รับคำทำนาย:
      - ชื่อ-นามสกุล: ${formData.fullName}
      - ชื่อเล่น: ${formData.nickname}
      - เพศ: ${formData.gender}
      - อายุ: ${formData.age} ปี
      - วันเกิด: ${formattedDob}
      - ราศีเกิด (ตามหลักไทย): ${zodiac}

      โปรดให้คำทำนายที่เจาะลึกตามช่วงอายุและราศีเกิด พร้อมคำแนะนำในการดำเนินชีวิต
    `;

    try {
      const result = await fetchWithRetry(prompt);
      setPrediction(result);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับสิ่งศักดิ์สิทธิ์ (API Error) กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-amber-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl w-full z-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full border border-amber-500/30 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 drop-shadow-sm">
            ตำหนักแม่หมอ โหราศาสตร์ AI
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto">
            เปิดดวงชะตา อ่านอนาคตของคุณด้วยศาสตร์แห่งดวงดาวผสานปัญญาประดิษฐ์
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Input: Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">ชื่อ - นามสกุล (จริง)</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>

            {/* Input: Nickname */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">ชื่อเล่น</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                placeholder="เช่น ชาย"
              />
            </div>

            {/* Input: Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">เพศ</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all [&>option]:bg-slate-800"
              >
                <option value="" disabled>-- เลือกเพศ --</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="เพศทางเลือก">เพศทางเลือก (LGBTQ+)</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
            </div>

            {/* Input: Age */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">อายุ (ปี)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="1"
                max="120"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                placeholder="เช่น 25"
              />
            </div>

            {/* Input: DOB */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">วัน/เดือน/ปีเกิด</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all [color-scheme:dark]"
              />
              {zodiac && (
                <p className="text-xs text-amber-400 mt-1 ml-1 flex items-center gap-1 animate-fade-in">
                  <Star className="w-3 h-3" /> คุณคือผู้ที่เกิดใน <strong>ราศี{zodiac}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-8">
            <h3 className="text-lg font-medium text-slate-200 mb-4 text-center">เลือกเรื่องที่ต้องการให้ทำนาย</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-500'
                      }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-medium text-center">{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-lg py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -ml-12"></div>
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    แม่หมอกำลังตรวจดวงชะตา...
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    ขอรับคำทำนาย
                    <Sun className="w-5 h-5" />
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Prediction Result Section */}
        {prediction && (
          <div className="relative animate-fade-in-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-purple-500/30 to-amber-500/30 rounded-2xl blur-md opacity-70"></div>
            <div className="relative bg-[#0f172a] border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-2xl">

              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                <h2 className="text-2xl font-bold text-amber-400 tracking-wide text-center">
                  คำทำนายของคุณ
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-500/50"></div>
              </div>

              <div className="prose prose-invert prose-amber max-w-none text-slate-300 leading-relaxed space-y-4">
                {prediction.split('\n').map((paragraph, index) => {
                  if (!paragraph.trim()) return null;
                  return <p key={index} className="text-base md:text-lg">{paragraph}</p>;
                })}
              </div>

              <div className="mt-8 text-center text-slate-500 text-sm italic">
                <p>คำทำนายนี้เป็นเพียงแนวทางและที่พึ่งทางใจ</p>
                <p>โปรดใช้สติและวิจารณญาณในการดำเนินชีวิต</p>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}} />
    </div>
  );
}

