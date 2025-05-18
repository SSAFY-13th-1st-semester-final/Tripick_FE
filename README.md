# Travel Planner - 프론트엔드

**Vue.js 기반 여행 계획 웹 애플리케이션**

> 여행 지역 선택, 장소 탐색, 최적 경로 추천, 사용자 및 커뮤니티 기능까지 제공하는 통합 여행 계획 플랫폼



## 프로젝트 개요

이 프로젝트는 사용자가 여행 지역 내의 장소 및 숙소를 탐색하고, 원하는 일정에 따라 최적 경로를 생성하여 여행 계획을 수립할 수 있도록 돕는 웹 애플리케이션입니다.

Spring Boot 기반의 RESTful API 서버와 연동되며, Kakao Maps API를 이용한 지도 기능을 포함하고 있습니다. 프론트엔드는 Vue.js를 사용합니다.

**Glassmorphism** 디자인을 적용하여 사용자가 여행 계획 과정을 가볍고 간단히 즐길 수 있도록 시각적 무게를 줄였습니다. 이를 통해 사용자 경험을 개선할 수 있습니다.




## 기술 스택

### Frontend

| 구분       | 기술                             |
|------------|----------------------------------|
| 프레임워크 | Vue.js 3 + Composition API       |
| 라우팅     | Vue Router                       |
| 상태관리   | Pinia                            |
| 스타일링   | SCSS, Glassmorphism 디자인 적용   |
| HTTP 통신  | Axios                            |
| 지도       | Kakao Maps JavaScript API        |
| 아이콘     |     |

### Backend

- Spring Boot 기반 RESTful API 서버로 구현 (프론트엔드와 별도 레포지토리 관리)
- AWS EC2 인스턴스에 배포되어 안정적인 서비스 환경 제공



## 프로젝트 구조

```bash
src
├── App.vue
├── assets
│   ├── data
│   │   └── regionData.json
│   ├── images
│   └── styles
│       ├── _glassmorphism.scss
│       ├── _variables.scss
│       ├── index.scss
│       └── main.scss
├── components
│   ├── common
│   │   ├── AppButton.vue
│   │   ├── AppCard.vue
│   │   ├── AppFooter.vue
│   │   ├── AppInput.vue
│   │   ├── AppNavbar.vue
│   │   ├── AppNotification.vue
│   │   ├── DatePicker.vue
│   │   └── KakaoMap.vue
│   ├── posts
│   │   └── PostCard.vue
│   ├── travel
│   │   ├── PlaceSearch.vue
│   │   ├── RegionSelector.vue
│   │   ├── TripPlanner.vue
│   │   └── TripSchedule.vue
│   └── user
│       ├── LoginForm.vue
│       ├── SignupForm.vue
│       └── UserProfile.vue
├── constants
│   └── index.js
├── layouts
│   ├── AuthLayout.vue
│   └── DefaultLayout.vue
├── main.js
├── router
│   └── index.js
├── services
│   ├── api.service.js
│   ├── auth.service.js
│   ├── post.service.js
│   ├── token.service.js
│   └── travel.service.js
├── stores
│   ├── auth.js
│   ├── notification.js
│   └── travel.js
├── style.css
├── utils
│   ├── formatters.js
│   ├── kakaoMapService.js
│   └── validators.js
└── views
    ├── auth
    │   ├── ChangePasswordView.vue
    │   ├── LoginView.vue
    │   └── SignupView.vue
    ├── HomeView.vue
    ├── posts
    │   ├── PostDetailView.vue
    │   ├── PostFormView.vue
    │   └── PostsListView.vue
    ├── travels
    │   └── TripPlannerView.vue
    └── users
        └── ProfileView.vue
```


## 핵심 기능

### 1. 사용자 관리 (Member CRUD)
- [x] 회원가입
- [x] 로그인 / 로그아웃
- [x] 마이페이지 내정보 조회 및 수정
- [x] 비밀번호 변경

### 2. 게시판 기능 (Post CRUD)
- [x] 게시글 목록 조회
- [x] 게시글 상세 보기
- [x] 게시글 작성, 수정, 삭제 기능

### 3. 여행 계획 기능
- [x] 여행 지역 선택 (예: 서울, 부산 등)
- [x] 장소 및 숙소 검색 및 조회 (Kakao Map 기반)
- [x] 장소를 일정에 추가 및 일자별 여행 계획 구성
- [x] Kakao 지도에서 장소 마커 및 상세 정보 표시
- [ ] 선택된 장소를 기반으로 최적 경로 자동 생성
- [ ] 여행 일자별 경로 및 장소 저장
- [ ] 장소 간 경로 시각화


## 데이터 유효성 검증

본 프로젝트는 데이터 유효성 검증 책임을 백엔드와 프론트엔드가 명확히 분담하여 구현합니다.  
백엔드는 최종 데이터 무결성과 보안, 비즈니스 로직 중심의 검증을 담당하며,  
프론트엔드는 사용자 경험 향상을 위해 입력 단계에서 실시간 유효성 검증을 수행하여 빠른 피드백을 제공합니다.  

이를 통해 즉각적인 사용자 피드백과 서버의 안정성을 동시에 확보하며,  
유효성 검증 로직은 재사용 가능하도록 모듈화하여 유지보수성과 확장성을 고려해 설계하였습니다.

### 주요 검증 항목

- **회원 가입 시 유효성 검증**
  - [x] 아이디 중복 검사: 입력된 아이디가 이미 존재하는지 실시간 확인하여 중복 가입을 방지합니다.
  - [x] 비밀번호 패턴 검사: 영문과 숫자 조합 8자리 이상 등 보안 기준에 부합하는지 검증합니다.
  - [x] 이메일 형식 검사: 이메일 주소가 RFC 표준에 맞는 올바른 형식인지 확인합니다.
  - [x] 전화번호 형식 검사: 국내 전화번호 형식(예: 010-1234-5678)에 적합한지 체크하여 입력 오류를 최소화합니다.

- **게시판 기능 내 권한 및 접근 제어**
  - [x] 사용자 역할 구분: 관리자와 일반 사용자의 역할을 분리하여 각 권한에 따른 기능 접근을 제한합니다.
  - [x] 비즈니스 로직 기반 권한 검사: 게시글 작성, 수정, 삭제 시 권한 없는 사용자의 접근을 차단하고, 적절한 권한을 가진 사용자만 작업할 수 있도록 합니다.
