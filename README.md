# ♞ PlayProof Frontend
> **매칭을 넘어 관계의 지속으로, 신뢰 기반 게임 팀워크 관리 플랫폼**

많은 게이머가 무작위 매칭에서 발생하는 ‘팀 운’이나 ‘트롤링’ 같은 통제 불가능한 변수로 피로도를 겪고 있습니다. **PlayProof**는 이를 구조적 문제로 정의하고, 단순한 일회성 매칭을 넘어 **지속 가능한 팀 관계를 전제로 하는 환경**을 설계합니다.

<br/>

## 🏆 Project Achievement
* **UMC(University Makes us Challenge) 우수상 수상** 🥇
    * 전국 대학생 연합 개발 동아리 소속 총 **73팀(약 803명)** 중 우수 프로젝트 선정
* 기획부터 디자인 시스템 구축, FE/BE 개발 및 배포까지 전 과정을 유기적인 협업으로 완수한 프로젝트입니다.

<br/>

## 💡 Service Vision: "Matching to Living"
PlayProof는 매칭이라는 시작점을 지나, 게이머들이 플레이 과정에서 편의를 느끼고 오랫동안 머무를 수 있는 실질적인 커뮤니티 공간을 지향합니다.

* **휘발되지 않는 관계:** 단발성 만남을 넘어 팀 경험이 누적되는 구조
* **데이터 기반의 신뢰:** 매너 점수(TS)와 플레이 스타일 태그를 통한 검증
* **관리의 효율화:** 팀 스케줄 및 미디어 아카이브를 통한 체계적인 팀워크 관리

<br/>

## 🛠️ Service Structure
PlayProof는 유저의 유입부터 관계 형성, 유지까지 총 **9개의 탭**으로 구성된 유기적인 여정을 제공합니다.

### 1. 진입 및 온보딩 
* 로그인과 회원가입 과정을 최소화하여 접근성 향상.
* 온보딩 단계에서 유저 데이터를 선제적으로 수집하여, 이후 매칭 단계에서의 불필요한 이탈을 방지하고 매칭 정확도를 높였습니다.

### 2. 매칭 
* 단순 모집 게시판 형태에서 벗어나 게임별 세부 조건 설정 및 맞춤 추천 로직을 제공합니다.
* 유저가 원하는 최적의 팀을 직접 탐색하고 선택할 수 있는 능동적 구조입니다.

### 3. 팀 아지트 (Azit) 
* 매칭된 팀이 단발성으로 끝나지 않도록 지원하는 독립적인 팀 전용 공간입니다.
* 실시간 텍스트/음성 채팅, 팀 스케줄 관리, 플레이 기록(미디어) 아카이브를 통해 팀의 히스토리를 쌓아갑니다.

### 4. 신뢰 시스템 
* 평판 시스템: 유저 피드백과 신고 시스템을 통해 매너 점수(TS)를 관리합니다.
* 전적 연동: 인게임 API 전적 연동을 통해 객관적인 실력 지표를 제공하여 신뢰도를 뒷받침합니다.

<br/>

## ✨ Implementation Highlights
서비스의 흐름이 끊기지 않도록 **UI/UX 인터랙션 설계**와 **상태 관리**에 집중하여 개발되었습니다.

* **Seamless Flow:** 홈에서 매칭 확인 후 팀 구성 시, 즉시 아지트로 연결되어 실시간 채팅과 활동으로 이어지는 유기적인 사용자 흐름(User Flow)을 구현했습니다.
* **State-Driven Interaction:**
    * 선택한 게임 카테고리에 따라 입력 항목과 UI 상태가 실시간으로 변경되는 동적 로직을 구현했습니다.
    * **조건부 렌더링:** 유저의 현재 권한, 작성 이력 등을 감지하여 댓글 활성화 여부나 중복 작성 방지 카드 인터랙션을 자동 제어합니다.
* **Responsive Logic:** 필터 적용 및 정렬 등 유저의 모든 액션에 즉각적으로 반응하는 고도화된 인터랙션 로직이 반영되어 있습니다.



---


## PlayProof의 백엔드 저장소입니다.
본 문서는 프로젝트 협업 가이드라인과 컨벤션 등을 포함합니다.

👉 깃 협업 가이드라인 상세   [확인하기](https://www.notion.so/Git-2d6ddc51f5c680e39e1df9094fef07ae?source=copy_link)<br/>
👉 코드 컨벤션 상세  [확인하기](https://www.notion.so/2d6ddc51f5c68096800ce2e4207911f9?source=copy_link)

## 기술 스택
- Node.js Runtime (v22 LTS 이상)
- Typescript
- Prisma
- Mysql

## 실행 방법
### 1. 클론
```bash
git clone https://github.com/Playproof-Umc/Playproof-Backend.git
```
### 2. 패키지 설치
```bash
npm install
```
### 3. 환경변수 설정 (.env)
루트 디렉토리에 .env 파일을 생성
```env
DATABASE_URL="mysql://root:비밀번호@localhost:3306/playproof"
LIVEKIT_URL="wss://your-livekit-domain"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
```
### 4. 서버 실행
```bash
npm run dev
```
실행 후 http://localhost:3000 접속

## 브랜치 전략: main / dev / feature
1. 이슈 생성
2. dev 브랜치에서 최신 코드를 pull 받기
3. 새로운 feature 브랜치를 생성
4. 작업 후 commit & push
5. Pull Request로 코드 리뷰 및 승인
6. dev에 머지
7. 기능 개발 완료 후 main에 머지

- **main 브랜치**
    - 실제 제품이 배포되는 기준 브랜치입니다.
    - 항상 **배포 가능한 안정 상태**를 유지해야 합니다.
    - `dev` 브랜치에서 충분히 검증된 코드만 병합됩니다.
- **dev 브랜치**
    - 기능 개발이 완료된 브랜치들이 **통합되는 개발 브랜치**입니다.
    - 여러 feature 브랜치를 병합하여 테스트 및 검증을 진행합니다.
    - 배포 준비가 완료되면 `main` 브랜치로 병합됩니다.
- **feature 브랜치**
    - 새로운 기능 개발, 버그 수정 등 **개별 작업 단위 브랜치**입니다.
    - `dev` 브랜치에서 분기하여 작업합니다.
    - 작업 완료 후 PR을 통해 `dev` 브랜치로 병합합니다.
    - **명명 규칙**: `type/#number`
        - *예시: `feat/#1`, `fix/#22`*

### 1. 커밋 메시지 컨벤션
| Tag Name       | Description                                    |
|----------------|------------------------------------------------|
| feat    | 새로운 기능 추가        |
| fix          | 버그 수정          |
| docs |  문서 수정 (README, 위키 등)    |
| style  | 코드 의미에 영향을 주지 않는 변경 (세미콜론, 포맷팅 등) |
| refactor | 코드 리팩토링 |
| test | 테스트 코드 추가 및 수정 |
| chore | 빌드 업무, 패키지 매니저 설정 등 기타 작업 |

### 2. Pull Request (PR) 규칙
- **제목**: `[Type] 작업 요약` (예: `[Feat] 카카오 로그인 기능 구현`)
- **내용 필수 포함 항목**:
    - 변경 사항에 대한 간략한 설명
    - 관련 Issue 번호 (`#이슈번호`)
    - 테스트 통과 여부 및 스크린샷 (UI 변경 시)

## 네이밍 컨벤션
|항목	|규칙|	예시|
|-------|----------------|----------|
|폴더명	|camelCase (단수형)|	user, auth, global|
|파일명|	kebab-case.ts|	user.controller.ts, app.ts|
|변수명	|camelCase	|userName, isActive, userList|
|함수명|	camelCase (동사 시작)|	getUserById(), validateEmail()|
|클래스명|	PascalCase	|UserService, UserController|
|인터페이스/타입|	PascalCase (I 접두사 X)|	User, CreateUserDto|
|상수/환경변수|	UPPER_SNAKE_CASE|	MAX_COUNT, DATABASE_URL|
|Enum|	PascalCase |	UserStatus.ACTIVE|

### 코드 스타일 (Code Style)
- 들여쓰기: 2칸 스페이스 
- 따옴표: 작은따옴표 (') 사용
- 세미콜론: 모든 문장 끝에 사용 (Always)
- 후행 쉼표: 리스트/객체 마지막 요소 뒤 추가 (Trailing Comma)
