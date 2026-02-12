'use client';

import { createClient } from '@/src/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const SESSION_KEY = 'sessionStartedAt';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false); // [추가] 아이디 저장 체크 상태
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // 세션 만료로 리다이렉트된 경우 signOut 후 메시지 표시
  useEffect(() => {
    if (searchParams.get('timeout') === '1') {
      supabase.auth.signOut();
      sessionStorage.removeItem(SESSION_KEY);
      setSessionExpiredMessage(true);
      // URL에서 timeout 제거 (새로고침 시 메시지 반복 방지)
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router, supabase.auth]);

  // [추가] 컴포넌트 마운트 시 로컬 스토리지에서 아이디 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberId(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('로그인 실패: ' + error.message);
      setLoading(false);
    } else {
      // [추가] 로그인 성공 시 아이디 저장 처리
      if (rememberId) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      // 3시간 자동 로그아웃용 세션 시작 시각 저장
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));

      router.push('/'); // 메인으로 이동
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">관리자 로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            서비스 이용을 위해 로그인이 필요합니다.
          </p>
          {sessionExpiredMessage && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 py-2 px-3 rounded">
              세션이 만료되었습니다. 다시 로그인해 주세요.
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {/* [추가] 아이디 저장 체크박스 */}
          <div className="flex items-center">
            <input
              id="remember-id"
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="remember-id"
              className="ml-2 text-sm text-gray-600 cursor-pointer select-none"
            >
              아이디 저장
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition font-bold shadow-sm"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
