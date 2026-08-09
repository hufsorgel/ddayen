# 나의 프리토킹 여권 — 배포 가이드

오르골 ↔ 세알 실시간 동기화 + 홈 화면 바로가기까지, 순서대로 따라 하시면 됩니다.
계정 생성/로그인/키 발급처럼 보안이 걸린 단계는 직접 진행해주셔야 하고,
나머지 코드/설정은 이 폴더에 전부 준비되어 있습니다.

---

## 1. GitHub에 올리기

1. https://github.com/new 에서 새 리포지토리 생성 (예: `ddayen`), Public/Private 아무거나 OK
2. 이 폴더(`app/`) 전체를 로컬에 받은 뒤, 터미널에서:

```bash
cd app
git init
git add .
git commit -m "init: ddayen app"
git branch -M main
git remote add origin https://github.com/내아이디/ddayen.git
git push -u origin main
```

---

## 2. Firebase 설정 (실시간 동기화의 핵심)

1. https://console.firebase.google.com → **프로젝트 추가** → 이름 아무거나 (예: `ddayen`)
2. 왼쪽 메뉴 **빌드 > Firestore Database** → **데이터베이스 만들기** → 위치는 `asia-northeast3(서울)` 추천 → **테스트 모드**로 시작 (규칙은 4번에서 교체합니다)
3. 왼쪽 메뉴 **프로젝트 설정(톱니바퀴)** → 아래로 스크롤 **내 앱** → **웹 앱 추가(</> 아이콘)** → 앱 닉네임 아무거나 입력 → **등록**
4. 화면에 뜨는 `firebaseConfig` 객체를 통째로 복사
5. `index.html`을 열어서 `firebaseConfig` 부분을 찾아 (`YOUR_API_KEY` 등으로 되어 있는 부분) 방금 복사한 값으로 **전체 교체**합니다:

```js
const firebaseConfig = {
  apiKey: "AIza...",              // ← 여기부터
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abcdef"    // ← 여기까지 콘솔에서 복사한 값으로 교체
};
```

6. Firestore 규칙 적용: Firebase 콘솔 → Firestore Database → **규칙** 탭 → 이 폴더의 `firestore.rules` 내용을 그대로 붙여넣고 **게시**
   - 이 앱은 로그인 기능이 없는 "오르골·세알 둘만 쓰는 앱"을 전제로 최소한의 검증만 걸어둔 규칙입니다. 링크만 알면 누구나 읽고 쓸 수 있으니, **앱 주소를 두 분 외에는 공유하지 않는 것**이 사실상의 보안입니다.
7. 수정한 `index.html`을 다시 GitHub에 push:

```bash
git add index.html
git commit -m "connect firebase"
git push
```

---

## 3. Vercel로 배포

1. https://vercel.com → GitHub 계정으로 로그인
2. **Add New > Project** → 방금 만든 `ddayen` 리포지토리 선택 → **Import**
3. Framework Preset은 **Other**(정적 파일이라 빌드 설정 필요 없음) 로 두고 **Deploy**
4. 배포가 끝나면 `https://ddayen.vercel.app` 같은 주소가 생깁니다. 이 주소를 오르골·세알 두 분이 각자 접속하면 됩니다.
5. 이후 GitHub에 push할 때마다 Vercel이 자동으로 재배포합니다.

---

## 4. 휴대폰 / PC 바로가기 만들기 (예쁜 아이콘 포함)

앱 안에 이미 `manifest.json`과 아이콘 파일들(`icons/` 폴더, 초록색 종이비행기+EN 배지 디자인)이 연결되어 있어서, 별도 설정 없이 바로 "홈 화면에 추가"가 가능합니다.

### iPhone (Safari)
1. Vercel 주소로 접속 → 하단 **공유 버튼(⬆️)** 탭
2. **홈 화면에 추가** 선택 → 아이콘과 이름(프리토킹여권) 확인 후 **추가**

### Android (Chrome)
1. Vercel 주소로 접속 → 우측 상단 **⋮ 메뉴** 탭
2. **홈 화면에 추가** 또는 **앱 설치** 선택 → **추가**

### PC (Chrome / Edge)
1. Vercel 주소로 접속 → 주소창 오른쪽 **설치 아이콘(⊕ 모양)** 클릭
   (안 보이면 우측 상단 **⋮ 메뉴 > 앱 설치**)
2. 설치하면 데스크톱/시작메뉴에 아이콘과 함께 바로가기가 생기고, 브라우저 탭 없이 독립 창으로 실행됩니다.

---

## 데이터 구조 참고

Firestore `entries` 컬렉션의 문서 하나 = 저장된 문장 1개:

| 필드 | 설명 |
|---|---|
| `owner` | `'orgol'` 또는 `'seal'` — 누가 만들었는지 |
| `original` / `english` | 원문 / 변환된 영어 문장 |
| `tag` | 식당·이동·쇼핑·숙소·일상·감정 중 하나 |
| `isStolen` | 상대방 문장을 "훔쳐온" 것인지 |
| `cheerCount` / `cheeredBy` | 응원 수 / 누가 응원했는지 (중복 응원 방지) |
| `stage` / `nextReview` | 복습 단계(0~4) / 다음 복습 예정일 (간격: 1·3·7·14·30일) |

두 사람이 같은 컬렉션을 실시간으로 구독(`onSnapshot`)하고 있어서, 한쪽이 문장을 저장하거나 응원을 누르면 상대방 화면에 새로고침 없이 바로 반영됩니다.

## 참고: Gemini API 없이 테스트하기

`index.html` 안의 `GEMINI_API_KEY`를 채우지 않으면 자동으로 **테스트 모드**로 동작합니다.
"환전하기" 버튼을 누를 때마다 정상 케이스 / 콩글리시(정상 JSON) / 콩글리시(파싱 깨짐 재현) 3가지 가짜 응답이 순서대로 나오며, 파싱 로직이 잘 버티는지 확인할 수 있습니다. 실제 Gemini API 키를 넣으면 자동으로 실제 API를 호출합니다.
