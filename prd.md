# Orange Boy Front PRD

## 1. 제품 개요
- 부산 특산품을 24시간 내 배송한다는 콘셉트의 전자상거래 프론트엔드.
- Next.js 14(App Router) + React 18 기반 SPA 경험과 Tailwind CSS로 구성된 UI.
- Strapi CMS를 헤드리스 백엔드로 사용하며, Next.js API 라우트를 통해 클라이언트와 연동.

## 2. 핵심 가치 제안
- 해외 및 국내 고객에게 부산 맛집/특산품을 빠르게 소개하고 주문 링크로 안내.
- 상품 데이터를 CMS에서 일원화 관리하여 비개발자도 손쉽게 콘텐츠를 업데이트.
- 관리자 모드에서 실시간 상품 CRUD와 이미지 업로드를 지원해 운영 효율 극대화.

## 3. 주요 사용자 & 페르소나
- **일반 고객**: 카테고리별 상품 탐색, 가격/설명 확인, 주문 링크(외부 폼)로 이동.
- **콘텐츠 관리자**: 관리자 로그인 후 상품을 추가·수정·삭제하고 이미지 업로드.
- **마케팅/운영 담당자**: CMS와 프론트 변화를 빠르게 확인하며 프로모션을 준비.

## 4. 사용자 여정
1. 방문자가 `orangboy` 도메인 접속 → 히어로 카피로 브랜드 메시지 전달.
2. 상단 네비게이션에서 Food/Snack/Tea/Juice/All 카테고리 선택.
3. 상품 카드를 클릭하면 모달로 상세 설명과 가격 확인 → 주문 링크 버튼(추가 예정)을 통해 외부 주문 폼 이동.
4. 관리자 URL(`/admin/login`) 접속 → 자격 증명 입력 → 세션 발급 후 `/admin/products`로 이동.
5. 관리자 페이지에서 상품 폼 입력, 이미지 업로드(Next 라우트 → Strapi 업로드) → 저장 시 CMS에 반영 → 프론트 즉시 반영(fetch no-store).

## 5. 기능 요구사항
### 5.1 공개 웹
- **Landing**: `/`에서 브랜드 슬로건 강조, 헤더는 모든 페이지에서 고정 노출.
- **상품 목록**: `/products`에서 Strapi `products` 컬렉션을 불러와 그리드로 렌더링. 카테고리 쿼리 파라미터로 필터 지원.
- **상품 상세 모달**: 카드 클릭 시 이미지·상품명·가격·설명 표기 및 구글 주문서 링크 버튼 제공(미제공 시 안내 문구).
- **네비게이션**: 헤더에서 카테고리 이동, 관리자/언어 전환 버튼 슬롯 확보.

### 5.2 관리자 도구
- **인증**: NextAuth Credentials Provider를 이용한 간단 로그인(현재 admin/1234 하드코딩). 세션은 JWT 전략.
- **접근 제어**: `middleware.ts`로 `/admin/products` 경로 보호, 미로그인 시 `/admin/login` 유도.
- **상품 CRUD**: `AdminProductsManager`에서 목록 조회, 신규 생성, 수정, 삭제 지원. 폼은 카테고리 드롭다운/주문 링크 입력/설명 입력 제공.
- **카테고리 필터**: 관리자 목록에서 All/카테고리 버튼으로 필터링하며 카드 클릭만으로 수정 모드 진입.
- **이미지 업로드**: `/api/admin/upload` 라우트를 통해 Strapi `/api/upload`로 프록시. 업로드 성공 시 id/url 반환하여 상품과 연결. Strapi 미접속 시에는 인메모리 data URL로 대체.
- **실시간 반영**: 모든 fetch 요청은 `cache: "no-store"`로 설정해 CMS 변경 사항 즉시 반영.
- **오프라인 대체 데이터**: Strapi 인증/연결이 불가한 경우 메모리 기반 fallback 스토어가 동작해 관리자 CRUD와 업로드를 테스트 가능.
- **카테고리 동기화**: Strapi 카테고리가 `Food/Snack/Tea/Juice` 대소문자 규칙을 따르므로 관리자 UI도 동일한 값으로 전송하며, 쿼리 파라미터는 자동으로 매핑.

## 6. 데이터 & API
- **데이터 모델(Product)**: `id`, `name`, `price`, `description`, `category`, `orderFormUrl`, `image(url)`.
- **공개 API**: `/api/products`(카테고리 필터링), `/api/products/[id]`(PUT/DELETE) → 내부적으로 `strapiFetch` 사용.
- **관리자 API**: `/api/admin/products` 및 `/api/admin/products/[id]` → `STRAPI_URL`/`STRAPI_TOKEN`으로 Strapi REST 호출.
- **업로드 API**: `/api/admin/upload` → 폼 데이터 그대로 Strapi로 전달 후 응답 가공.
- **샘플 데이터**: 기본적으로 CMS 데이터를 사용하며, 관리자 토큰이 없을 때만 임시 메모리 스토어가 빈 상태로 동작.

## 7. 기술 스택 & 의존성
- Next.js 14.2.14(App Router, 서버 액션 미사용), React 18.3, NextAuth 4.24.
- Tailwind CSS 3.4, PostCSS, TypeScript 5.6.
- 런타임 환경: Node.js 18+ (Next 권장 버전).
- 이미지 도메인 화이트리스트: `http://localhost:1337` (Strapi 기본 포트).

## 8. 환경 변수 & 설정
- `NEXT_PUBLIC_CMS_URL`: 브라우저에서 접근 가능한 Strapi 베이스 URL.
- `STRAPI_API_TOKEN`: 서버 사이드 `strapiFetch`에서 사용(공개 API 프록시).
- `STRAPI_URL`, `STRAPI_TOKEN`: 관리자 API 라우트에서 사용(Strapi REST 호출용).
- `NEXTAUTH_SECRET`: NextAuth JWT 암호화 시드.
- 배포 시 CMS 도메인, 이미지 호스트 패턴, HTTPS 적용 여부를 환경에 맞게 조정해야 함.

## 9. 리스크 & 향후 과제
- **보안**: Credentials Provider가 하드코딩 자격 증명을 사용 중 → Strapi/Auth Provider 연동 또는 환경 변수화 필요.
- **환경 변수 일관성**: `STRAPI_API_TOKEN` vs `STRAPI_TOKEN` 이름이 달라 혼동 가능 → 통합 검토 필요.
- **중복 업로드 라우트**: `/api/admin/upload`와 `/admin/upload`(app 라우트)가 동시에 존재 → 실제 사용 경로 정리 권장.
- **주문 흐름**: 구글폼 링크가 Instagram 리다이렉트를 거치므로 실제 주문 폼 응답 처리·알림 체계 점검 필요.
- **Fallback 영속성**: 메모리 기반 대체 스토어는 서버 재시작 시 초기화되므로 운영 환경에서는 Strapi 연결 복구가 필수.
- **품질 관리**: 테스트/린트 스크립트 미구현, 오류 처리(예: fetch 실패 시 사용자 피드백 부족) 개선 여지.
- **확장 계획**: 다국어 지원, 배송/주문 상태 조회, 고객용 계정 시스템 등 스펙 확장 가능성 검토.
