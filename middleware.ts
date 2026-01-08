import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. 초기 Response 생성
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Supabase Server Client 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // [수정] 타입 명시를 통해 'any' 오류 해결
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );

          // 미들웨어에서 쿠키를 설정하려면 Response 객체를 새로고침해야 함
          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. 사용자 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. 경로 보호 로직
  // 로그인하지 않았는데 보호된 경로(로그인 페이지 등 제외)로 접근 시 -> /login 리다이렉트
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') && // 정적 파일 제외
    !request.nextUrl.pathname.includes('.') // 이미지 등 파일 제외
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 이미 로그인했는데 로그인 페이지로 접근 시 -> 메인(/) 리다이렉트
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
