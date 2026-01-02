# Playproof-Backend
Playproof 백엔드 레포지토리입니다.
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