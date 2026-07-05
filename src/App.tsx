import { type CSSProperties, useMemo, useState } from 'react'
import './App.css'

type CategoryKey = 'muscle' | 'pressure' | 'glucose' | 'nutrition' | 'gut'
type MainTab = 'home' | 'meals' | 'check' | 'guide' | 'settings'

type Category = {
  key: CategoryKey
  title: string
  icon: string
  short: string
  detail: string
  nutrients: string[]
  habits: string[]
  guide: string
}

type Question = {
  id: string
  category: CategoryKey
  stepLabel: string
  text: string
  // true면 '아니요' 응답이 점검이 필요한 신호예요 (긍정형 문항)
  positive?: boolean
}

type MealLog = {
  date: string
  meal: string
  amount: '다 먹음' | '절반 이상' | '절반 정도' | '조금' | '거의 안 먹음'
  water: number
  protein: boolean
  memo: string
}

type CategoryScore = Category & {
  checked: number
  level: '양호' | '점검 필요' | '관리 참고'
  summary: string
  reasons: string[]
}

const storageKey = 'silvermeal-care:onboarding-complete'

const categories: Category[] = [
  {
    key: 'pressure',
    title: '혈압 관리',
    icon: 'ti ti-heartbeat',
    short: '짠 음식, 국물 음식, 가공식품 습관 확인',
    detail:
      '혈압 관리가 걱정된다면 짠 음식, 국물 음식, 가공식품 섭취 습관을 점검해보면 도움이 돼요. 두통이나 어지러움을 자주 느낀다면 나트륨 섭취 습관부터 함께 살펴보세요.',
    nutrients: ['나트륨', '칼륨'],
    habits: ['짠 음식', '국물 음식', '가공식품 섭취'],
    guide:
      '국물은 적게 먹고 음식 간을 싱겁게 조절해보세요. 시금치, 브로콜리, 토마토, 바나나처럼 칼륨이 풍부한 식품과 규칙적인 걷기도 도움이 돼요.',
  },
  {
    key: 'glucose',
    title: '혈당 관리',
    icon: 'ti ti-candy',
    short: '단 음료, 간식, 식사 시간 확인',
    detail:
      '혈당 관리가 걱정된다면 단 음료, 간식, 불규칙한 식사 시간을 점검해보면 도움이 돼요. 식후 졸림이 심하거나 쉽게 피로하다면 식사 습관을 함께 살펴보세요.',
    nutrients: ['탄수화물', '당류', '식이섬유'],
    habits: ['단 음료', '간식', '규칙적인 식사시간'],
    guide:
      '규칙적인 식사 시간을 지키고 간식을 줄이며, 현미·채소·콩류·고구마 같은 식이섬유 식품을 챙겨보세요. 식사 후 20~30분 정도 걷는 것도 도움이 돼요.',
  },
  {
    key: 'muscle',
    title: '근육 건강',
    icon: 'ti ti-barbell',
    short: '단백질 섭취, 활동량, 체중 변화 확인',
    detail:
      '근육은 걷기, 균형 잡기, 자세 유지 같은 일상 움직임에 중요한 역할을 해요. 무릎이나 허리가 자주 불편하다면 단백질 섭취와 활동량을 점검해보면 좋아요.',
    nutrients: ['단백질', '비타민 D', '칼슘'],
    habits: ['단백질 섭취량', '식사 거르기', '유제품 섭취 여부'],
    guide:
      '매 끼니 달걀, 생선, 두부, 우유·요거트 같은 단백질 식품을 하나씩 챙기고, 주 2~3회 걷기나 근력 운동을 이어가보면 좋아요.',
  },
  {
    key: 'nutrition',
    title: '영양 보충',
    icon: 'ti ti-apple',
    short: '식사량, 규칙적인 식사, 편식 확인',
    detail:
      '식사량이 줄거나 체중 변화가 있다면 편식 여부와 식사 횟수를 함께 점검해보면 도움이 돼요. 기력이 떨어지거나 활동이 힘들게 느껴질 때도 함께 살펴보세요.',
    nutrients: ['열량', '단백질', '수분'],
    habits: ['식사량 변화', '편식', '체중 변화'],
    guide:
      '생선, 달걀, 우유, 과일처럼 영양 밀도가 높은 식품을 조금씩 자주 드시고, 규칙적인 식사 시간을 지켜보면 좋아요.',
  },
  {
    key: 'gut',
    title: '장 건강',
    icon: 'ti ti-droplet',
    short: '수분, 식이섬유, 배변 상태 확인',
    detail:
      '배변이 불편하거나 속이 자주 더부룩하다면 수분과 식이섬유 섭취 습관을 점검해보면 도움이 돼요.',
    nutrients: ['수분', '식이섬유'],
    habits: ['물 섭취량', '채소·과일 섭취', '배변 상태'],
    guide:
      '충분한 물과 브로콜리, 양배추, 사과, 바나나, 귀리 같은 식이섬유 식품을 함께 챙기고, 가벼운 운동으로 혈액순환을 돕는 것도 좋아요.',
  },
]

const surveyScope = categories.map((category) => category.title)

const questions: Question[] = [
  { id: 'q1', category: 'pressure', stepLabel: '혈압 관리', text: '국물 음식이나 찌개를 자주 드시나요?' },
  {
    id: 'q2',
    category: 'pressure',
    stepLabel: '혈압 관리',
    text: '젓갈, 김치, 햄, 라면 같은 짠 음식을 자주 드시나요?',
  },
  { id: 'q3', category: 'pressure', stepLabel: '혈압 관리', text: '두통이나 어지러움을 자주 느끼나요?' },
  {
    id: 'q4',
    category: 'pressure',
    stepLabel: '혈압 관리',
    text: '평소 혈압이 높다는 이야기를 들은 적이 있나요?',
  },
  { id: 'q5', category: 'glucose', stepLabel: '혈당 관리', text: '식사 후 졸림이 자주 심한 편인가요?' },
  { id: 'q6', category: 'glucose', stepLabel: '혈당 관리', text: '단 음식이나 음료를 거의 매일 드시나요?' },
  { id: 'q7', category: 'glucose', stepLabel: '혈당 관리', text: '식사 시간이 불규칙한 편인가요?' },
  {
    id: 'q8',
    category: 'glucose',
    stepLabel: '혈당 관리',
    text: '물을 많이 마시거나 소변을 자주 보는 편인가요?',
  },
  { id: 'q9', category: 'muscle', stepLabel: '근육 건강', text: '최근 3개월 동안 체중이 줄었나요?' },
  {
    id: 'q10',
    category: 'muscle',
    stepLabel: '근육 건강',
    text: '의자에서 일어나거나 계단을 오르는 것이 힘들게 느껴지나요?',
  },
  {
    id: 'q11',
    category: 'muscle',
    stepLabel: '근육 건강',
    text: '일주일에 3회 이상 고기, 생선, 달걀, 두부 같은 단백질 식품을 드시나요?',
    positive: true,
  },
  {
    id: 'q12',
    category: 'muscle',
    stepLabel: '근육 건강',
    text: '일주일에 2회 이상 걷기나 근력운동을 하시나요?',
    positive: true,
  },
  { id: 'q13', category: 'nutrition', stepLabel: '영양 보충', text: '최근 식사량이 줄었다고 느끼나요?' },
  { id: 'q14', category: 'nutrition', stepLabel: '영양 보충', text: '최근 3개월 동안 체중이 줄었나요?' },
  {
    id: 'q15',
    category: 'nutrition',
    stepLabel: '영양 보충',
    text: '하루 세 끼를 규칙적으로 드시나요?',
    positive: true,
  },
  { id: 'q16', category: 'nutrition', stepLabel: '영양 보충', text: '편식을 자주 하는 편인가요?' },
  {
    id: 'q17',
    category: 'gut',
    stepLabel: '장 건강',
    text: '일주일에 3회 이상 배변이 어렵거나 변비가 있다고 느끼나요?',
  },
  {
    id: 'q18',
    category: 'gut',
    stepLabel: '장 건강',
    text: '하루 물을 6잔(약 1.2L) 이상 드시나요?',
    positive: true,
  },
  { id: 'q19', category: 'gut', stepLabel: '장 건강', text: '채소와 과일을 매일 드시나요?', positive: true },
  {
    id: 'q20',
    category: 'gut',
    stepLabel: '장 건강',
    text: '배가 자주 더부룩하거나 복부 팽만감을 느끼나요?',
  },
]

const initialLogs: MealLog[] = []

const amountScore = {
  '다 먹음': 1,
  '절반 이상': 0.75,
  '절반 정도': 0.5,
  조금: 0.25,
  '거의 안 먹음': 0,
}

const waterOptions = [200, 400, 600, 800, 1000]

function App() {
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [onboardingMode, setOnboardingMode] = useState<'intro' | 'survey' | 'result'>('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<MainTab>('home')
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<MealLog[]>(initialLogs)
  const [draftLog, setDraftLog] = useState<MealLog>({
    date: getTodayInputValue(),
    meal: '아침',
    amount: '절반 이상',
    water: 400,
    protein: true,
    memo: '',
  })

  const categoryScores = useMemo<CategoryScore[]>(() => {
    return categories.map((category) => {
      const concerningQuestions = questions
        .filter((question) => question.category === category.key)
        .filter((question) => isConcerningAnswer(question, answers[question.id]))
      const level =
        concerningQuestions.length >= 3
          ? '관리 참고'
          : concerningQuestions.length >= 1
            ? '점검 필요'
            : '양호'

      return {
        ...category,
        checked: concerningQuestions.length,
        level,
        summary: getHabitSummary(category.key, concerningQuestions.length),
        reasons: concerningQuestions.map((question) => question.text),
      }
    })
  }, [answers])

  const weeklySummary = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 6)
    const cutoffValue = cutoff.toLocaleDateString('sv-SE')
    const recentLogs = logs.filter((log) => log.date >= cutoffValue)
    const count = recentLogs.length
    const averageMeal =
      recentLogs.reduce((sum, log) => sum + amountScore[log.amount], 0) / Math.max(count, 1)
    const totalWater = recentLogs.reduce((sum, log) => sum + log.water, 0)
    const proteinMeals = recentLogs.filter((log) => log.protein).length

    return {
      averageMeal,
      count,
      totalWater,
      proteinMeals,
      needsMealCheck: count > 0 && averageMeal < 0.7,
      needsWaterCheck: count > 0 && totalWater < 1500,
      needsProteinCheck: count > 0 && proteinMeals < Math.ceil(count / 2),
    }
  }, [logs])

  const highlighted = categoryScores.filter((category) => category.level !== '양호')

  const finishOnboarding = () => {
    localStorage.setItem(storageKey, 'true')
    setOnboardingDone(true)
    setActiveTab('home')
  }

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey)
    setOnboardingDone(false)
    setOnboardingMode('intro')
    setQuestionIndex(0)
  }

  const answerCurrentQuestion = (value: boolean) => {
    const currentQuestion = questions[questionIndex]
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }))

    if (questionIndex === questions.length - 1) {
      setOnboardingMode('result')
      return
    }

    setQuestionIndex((current) => current + 1)
  }

  const moveQuestion = (direction: 'prev' | 'next') => {
    setQuestionIndex((current) => {
      if (direction === 'prev') return Math.max(current - 1, 0)
      return Math.min(current + 1, questions.length - 1)
    })
  }

  const toggleAnswer = (id: string) => {
    setAnswers((current) => ({ ...current, [id]: !current[id] }))
  }

  const addLog = () => {
    setLogs((current) => [draftLog, ...current])
    setDraftLog((current) => ({ ...current, memo: '' }))
  }

  if (!onboardingDone) {
    return (
      <Onboarding
        categoryScores={categoryScores}
        mode={onboardingMode}
        onAnswer={answerCurrentQuestion}
        onFinish={finishOnboarding}
        onMoveQuestion={moveQuestion}
        onStartSurvey={() => setOnboardingMode('survey')}
        questionIndex={questionIndex}
      />
    )
  }

  return (
    <main className="app-frame">
      <header className="app-header">
        <div className="brand-row">
          <span aria-hidden="true" className="brand-mark">
            <i className="ti ti-leaf" />
          </span>
          <div>
            <p className="eyebrow">SilverMeal Care</p>
            <h1>{getTabTitle(activeTab)}</h1>
          </div>
        </div>
      </header>

      <section className="app-content">
        {activeTab === 'home' && (
          <Home
            hasCheckResult={Object.keys(answers).length > 0}
            highlighted={highlighted}
            logs={logs}
            onMoveTab={setActiveTab}
            weeklySummary={weeklySummary}
          />
        )}
        {activeTab === 'meals' && (
          <Meals
            draftLog={draftLog}
            logs={logs}
            onAddLog={addLog}
            onChangeDraft={setDraftLog}
          />
        )}
        {activeTab === 'check' && (
          <Check answers={answers} categoryScores={categoryScores} onToggleAnswer={toggleAnswer} />
        )}
        {activeTab === 'guide' && <Guide categoryScores={categoryScores} />}
        {activeTab === 'settings' && <Settings onResetOnboarding={resetOnboarding} />}
      </section>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </main>
  )
}

function Onboarding({
  categoryScores,
  mode,
  onAnswer,
  onFinish,
  onMoveQuestion,
  onStartSurvey,
  questionIndex,
}: {
  categoryScores: CategoryScore[]
  mode: 'intro' | 'survey' | 'result'
  onAnswer: (value: boolean) => void
  onFinish: () => void
  onMoveQuestion: (direction: 'prev' | 'next') => void
  onStartSurvey: () => void
  questionIndex: number
}) {
  const question = questions[questionIndex]
  const progressPercent = Math.round(((questionIndex + 1) / questions.length) * 100)
  const categoryTone = getSurveyTone(question.stepLabel)

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        {mode === 'intro' && (
          <>
            <h1 className="intro-title">식습관 점검</h1>
            <p className="sub-copy">
              내 식습관을
              <br />
              짧게 확인해요
            </p>
            <p className="survey-meta">약 4분 · 20개 항목</p>
            <div className="scope-badges intro-badges">
              {surveyScope.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="intro-action">
              <button className="primary-button" onClick={onStartSurvey} type="button">
                시작하기 →
              </button>
            </div>
          </>
        )}

        {mode === 'survey' && (
          <>
            <CategoryStepBar currentLabel={question.stepLabel} />
            <p
              className="category-cue"
              style={
                {
                  '--tone': categoryTone.main,
                  '--tone-soft': categoryTone.soft,
                  '--tone-border': categoryTone.border,
                } as CSSProperties
              }
            >
              {question.stepLabel} 관련 질문입니다.
            </p>
            <div className="question-card">
              <div className="progress-row">
                <div
                  aria-label={`설문 진행률 ${progressPercent}%`}
                  className="progress-track"
                  role="progressbar"
                  style={
                    {
                      '--progress': `${progressPercent}%`,
                      '--tone': categoryTone.main,
                    } as CSSProperties
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <span />
                </div>
                <strong>
                  {questionIndex + 1} / {questions.length}
                </strong>
              </div>
              <h1>{question.text}</h1>
              <div className="answer-actions">
                <button onClick={() => onAnswer(false)} type="button">
                  아니요
                </button>
                <button className="primary-button" onClick={() => onAnswer(true)} type="button">
                  네
                </button>
              </div>
            </div>
            <div className="onboarding-actions">
              <button disabled={questionIndex === 0} onClick={() => onMoveQuestion('prev')} type="button">
                이전
              </button>
              <button
                disabled={questionIndex === questions.length - 1}
                onClick={() => onMoveQuestion('next')}
                type="button"
              >
                건너뛰기
              </button>
            </div>
          </>
        )}

        {mode === 'result' && (
          <>
            <p className="eyebrow">식습관 점검 결과</p>
            <h1>내 식습관 점검 결과예요</h1>
            <ResultCards categoryScores={categoryScores} compact />
            <p className="diagnosis-note">
              이 결과는 식습관 점검을 위한 참고용이며 의학적 진단이 아니에요.
            </p>
            <button className="primary-button" onClick={onFinish} type="button">
              홈으로 시작
            </button>
          </>
        )}
      </section>
    </main>
  )
}

function CategoryStepBar({ currentLabel }: { currentLabel: string }) {
  const currentIndex = surveyScope.indexOf(currentLabel)

  return (
    <div className="category-stepbar">
      {surveyScope.map((item, index) => {
        const tone = getSurveyTone(item)

        return (
          <span
            className={index <= currentIndex ? 'active' : ''}
            key={item}
            style={
              {
                '--tone': tone.main,
                '--tone-soft': tone.soft,
              } as CSSProperties
            }
          >
            {item}
          </span>
        )
      })}
    </div>
  )
}

function Home({
  hasCheckResult,
  highlighted,
  logs,
  onMoveTab,
  weeklySummary,
}: {
  hasCheckResult: boolean
  highlighted: CategoryScore[]
  logs: MealLog[]
  onMoveTab: (tab: MainTab) => void
  weeklySummary: {
    averageMeal: number
    count: number
    totalWater: number
    proteinMeals: number
    needsMealCheck: boolean
    needsWaterCheck: boolean
    needsProteinCheck: boolean
  }
}) {
  const today = getTodayInputValue()
  const todayLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
  const todayLogs = logs.filter((log) => log.date === today)
  const summaryChips = hasCheckResult
    ? highlighted.length > 0
      ? highlighted.slice(0, 3).map((category) => category.title)
      : ['현재 양호']
    : ['점검 전']

  return (
    <div className="stack">
      <section className="home-hero">
        <div>
          <p className="today-label">{todayLabel}</p>
          <h2>오늘 식사 기록을 확인해볼까요?</h2>
          <p>
            {hasCheckResult
              ? highlighted.length > 0
                ? `${highlighted.length}개 영역에서 식습관 점검이 필요해요.`
                : '현재 응답 기준으로 주요 식습관은 안정적으로 보여요.'
              : '식습관 점검을 완료하면 요약 결과가 여기에 표시돼요.'}
          </p>
        </div>
      </section>

      <section className="meal-status-panel">
        <div className="section-title-row">
          <div className="panel-heading">
            <span aria-hidden="true" className="icon-button">
              <i className="ti ti-soup" />
            </span>
            <div>
              <h2>오늘 식사 기록</h2>
              <p>{todayLogs.length > 0 ? `오늘 ${todayLogs.length}회 기록했어요` : '아직 기록된 식사가 없어요'}</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => onMoveTab('meals')} type="button">
            식사 입력
          </button>
        </div>
      </section>

      <section className="summary-chip-panel">
        <h2>식습관 점검 요약</h2>
        <div className="summary-chips">
          {summaryChips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </section>

      <section className="metric-grid">
        <Metric
          label="최근 7일 평균 식사량"
          value={weeklySummary.count > 0 ? `${Math.round(weeklySummary.averageMeal * 100)}%` : '-'}
        />
        <Metric
          label="최근 7일 수분량"
          value={weeklySummary.count > 0 ? `${weeklySummary.totalWater}ml` : '-'}
        />
        <Metric
          label="최근 7일 단백질 포함"
          value={weeklySummary.count > 0 ? `${weeklySummary.proteinMeals}/${weeklySummary.count}회` : '-'}
        />
      </section>

      <section className="home-actions">
        <button onClick={() => onMoveTab('check')} type="button">
          <span className="home-action-head">
            <strong>식습관 점검 결과</strong>
            <span aria-hidden="true" className="home-action-chevron">
              ›
            </span>
          </span>
          <span>설문 기반 자동 분류 결과 확인</span>
        </button>
        <button onClick={() => onMoveTab('guide')} type="button">
          <span className="home-action-head">
            <strong>식사 가이드</strong>
            <span aria-hidden="true" className="home-action-chevron">
              ›
            </span>
          </span>
          <span>카테고리별 식사 관리 팁 확인</span>
        </button>
      </section>

      <section className="report-panel">
        <h2>최근 7일 점검 메모</h2>
        <ul>
          {weeklySummary.count === 0 && <li>식사 기록이 쌓이면 최근 7일 점검 메모가 표시됩니다.</li>}
          {weeklySummary.needsMealCheck && <li>최근 식사량이 낮게 나타나 식사량 변화를 확인해보세요.</li>}
          {weeklySummary.needsWaterCheck && (
            <li>기록된 수분 섭취량이 낮아 섭취 가능한 수분원을 확인해보세요.</li>
          )}
          {weeklySummary.needsProteinCheck && (
            <li>단백질 식품이 포함된 식사가 적어 섭취 여부를 점검해보세요.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

function Meals({
  draftLog,
  logs,
  onAddLog,
  onChangeDraft,
}: {
  draftLog: MealLog
  logs: MealLog[]
  onAddLog: () => void
  onChangeDraft: (log: MealLog) => void
}) {
  const changeWater = (amount: number) => {
    onChangeDraft({ ...draftLog, water: Math.max(0, draftLog.water + amount) })
  }

  return (
    <div className="stack">
      <section className="form-panel">
        <div className="date-field wide">
          <span>날짜</span>
          <details>
            <summary>
              {formatKoreanDate(draftLog.date)}
              <span className="date-field-hint">날짜 변경</span>
            </summary>
            <label>
              날짜 변경
              <input
                onChange={(event) => onChangeDraft({ ...draftLog, date: event.target.value })}
                type="date"
                value={draftLog.date}
              />
            </label>
          </details>
        </div>
        <label>
          식사
          <select
            onChange={(event) => onChangeDraft({ ...draftLog, meal: event.target.value })}
            value={draftLog.meal}
          >
            <option>아침</option>
            <option>점심</option>
            <option>저녁</option>
            <option>간식</option>
          </select>
        </label>
        <label>
          식사량
          <select
            onChange={(event) =>
              onChangeDraft({ ...draftLog, amount: event.target.value as MealLog['amount'] })
            }
            value={draftLog.amount}
          >
            <option>다 먹음</option>
            <option>절반 이상</option>
            <option>절반 정도</option>
            <option>조금</option>
            <option>거의 안 먹음</option>
          </select>
        </label>
        <div className="water-field">
          <span>수분량</span>
          <div className="stepper-row">
            <button onClick={() => changeWater(-200)} type="button">
              -
            </button>
            <strong>{draftLog.water}ml</strong>
            <button onClick={() => changeWater(200)} type="button">
              +
            </button>
          </div>
          <div className="water-options">
            {waterOptions.map((water) => (
              <button
                className={draftLog.water === water ? 'selected' : ''}
                key={water}
                onClick={() => onChangeDraft({ ...draftLog, water })}
                type="button"
              >
                {water / 200}컵
              </button>
            ))}
          </div>
        </div>
        <button
          aria-pressed={draftLog.protein}
          className={`protein-toggle wide ${draftLog.protein ? 'active' : ''}`}
          onClick={() => onChangeDraft({ ...draftLog, protein: !draftLog.protein })}
          type="button"
        >
          <span>
            <strong>단백질 식품 포함</strong>
            <small>{draftLog.protein ? '포함했어요' : '포함하지 않았어요'}</small>
          </span>
          <i aria-hidden="true" />
        </button>
        <label className="wide">
          메모
          <input
            onChange={(event) => onChangeDraft({ ...draftLog, memo: event.target.value })}
            placeholder="예: 입맛 적음, 국물 위주 식사"
            type="text"
            value={draftLog.memo}
          />
        </label>
        <button className="primary-button wide" onClick={onAddLog} type="button">
          기록 추가
        </button>
      </section>

      <section className="log-list">
        {logs.length === 0 && (
          <div className="empty-state">
            <strong>오늘 기록한 식사가 없어요</strong>
            <span>식사 내용을 입력하고 기록 추가를 눌러보세요.</span>
          </div>
        )}
        {logs.map((log, index) => (
          <article className="log-item" key={`${log.date}-${log.meal}-${index}`}>
            <div>
              <strong>
                {formatKoreanDate(log.date)} · {log.meal}
              </strong>
              <span>{log.memo || '메모 없음'}</span>
            </div>
            <div className="log-meta">
              <span>{log.amount}</span>
              <span>{log.water}ml</span>
              <span>{log.protein ? '단백질 포함' : '단백질 미기록'}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function Check({
  answers,
  categoryScores,
  onToggleAnswer,
}: {
  answers: Record<string, boolean>
  categoryScores: CategoryScore[]
  onToggleAnswer: (id: string) => void
}) {
  const [isResurveyOpen, setIsResurveyOpen] = useState(false)
  const [appliedMessage, setAppliedMessage] = useState('')

  const openResurvey = () => {
    setAppliedMessage('')
    setIsResurveyOpen(true)
  }

  const applyResurvey = () => {
    setAppliedMessage('반영 완료')
  }

  const allQuestionsSelected = questions.every((question) => answers[question.id])

  const toggleResurveyAnswer = (id: string) => {
    setAppliedMessage('')
    onToggleAnswer(id)
  }

  const toggleAllQuestions = () => {
    const nextValue = !allQuestionsSelected

    setAppliedMessage('')
    questions.forEach((question) => {
      if (Boolean(answers[question.id]) !== nextValue) {
        onToggleAnswer(question.id)
      }
    })
  }

  if (isResurveyOpen) {
    return (
      <div className="stack">
        <div className="check-header">
          <div>
            <h2>점검표</h2>
            <p>현재 식습관에 맞게 항목을 다시 체크한 뒤 저장할 수 있습니다.</p>
          </div>
          <div className="check-actions">
            <button className="secondary-button" onClick={toggleAllQuestions} type="button">
              {allQuestionsSelected ? '모두 해제' : '모두 선택'}
            </button>
            <button
              className="secondary-button"
              onClick={() => setIsResurveyOpen(false)}
              type="button"
            >
              돌아가기
            </button>
            <button
              className="primary-button"
              disabled={appliedMessage === '반영 완료'}
              onClick={applyResurvey}
              type="button"
            >
              {appliedMessage === '반영 완료' ? '반영 완료' : '저장'}
            </button>
          </div>
        </div>
        <section className="question-panel resurvey-panel">
          <QuestionList answers={answers} onToggleAnswer={toggleResurveyAnswer} />
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="check-header">
        <div>
          <h2>식습관 점검 결과</h2>
          <p>설문 응답을 바탕으로 카테고리별 점검 결과를 보여줍니다.</p>
        </div>
        <div className="check-actions">
          {appliedMessage && <span>{appliedMessage}</span>}
          <button className="secondary-button" onClick={openResurvey} type="button">
            다시 점검하기
          </button>
        </div>
      </div>
      <ResultCards categoryScores={categoryScores} />
    </div>
  )
}

function Guide({ categoryScores }: { categoryScores: CategoryScore[] }) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryScore | null>(null)

  if (selectedCategory) {
    return (
      <div className="stack">
        <div className="check-header">
          <div>
            <h2>{selectedCategory.title}</h2>
            <p>식사 관리에 참고할 수 있는 핵심 내용입니다.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setSelectedCategory(null)}
            type="button"
          >
            목록으로
          </button>
        </div>
        <section className="guide-detail">
          <div className="guide-card-head">
            <span className="category-icon">
              <i aria-hidden="true" className={selectedCategory.icon} />
            </span>
            <h2>{selectedCategory.title}</h2>
          </div>
          <div className="tag-row">
            {selectedCategory.nutrients.map((nutrient) => (
              <small key={nutrient}>{nutrient}</small>
            ))}
          </div>
          <p>{selectedCategory.guide}</p>
          <div className="habit-list">
            <strong>점검할 식습관</strong>
            <ul>
              {selectedCategory.habits.map((habit) => (
                <li key={habit}>{habit}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="guide-grid">
      {categoryScores.map((category) => (
        <button
          className="guide-card"
          key={category.key}
          onClick={() => setSelectedCategory(category)}
          type="button"
        >
          <div className="guide-card-head">
            <span className="category-icon">
              <i aria-hidden="true" className={category.icon} />
            </span>
            <h2>{category.title}</h2>
            <span aria-hidden="true" className="guide-chevron">
              ›
            </span>
          </div>
          <div className="tag-row">
            {category.nutrients.map((nutrient) => (
              <small key={nutrient}>{nutrient}</small>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}

function Settings({ onResetOnboarding }: { onResetOnboarding: () => void }) {
  const [profile, setProfile] = useState({
    age: '',
    mealReminder: '08:00',
    name: '',
  })
  const [showAbout, setShowAbout] = useState(false)

  if (showAbout) {
    return (
      <div className="stack">
        <div className="check-header">
          <div>
            <h2>서비스 소개</h2>
            <p>SilverMeal Care가 어떤 목적의 서비스인지 확인할 수 있습니다.</p>
          </div>
          <button className="secondary-button" onClick={() => setShowAbout(false)} type="button">
            설정으로
          </button>
        </div>
        <section className="notice-panel">
          <h2>SilverMeal Care</h2>
          <p>
            고령자의 식사 기록과 식습관 점검을 바탕으로, 일상에서 참고할 수 있는 영양
            관리 가이드를 제공하는 웹서비스입니다.
          </p>
          <p>본 서비스는 질병을 진단하거나 치료 식단을 제공하지 않습니다.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <section className="settings-panel">
        <h2>프로필 / 설정</h2>
        <div className="settings-grid">
          <label>
            이름
            <input
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              placeholder="이름을 입력하세요"
              type="text"
              value={profile.name}
            />
          </label>
          <label>
            나이
            <input
              min="0"
              onChange={(event) => setProfile({ ...profile, age: event.target.value })}
              placeholder="나이를 입력하세요"
              type="number"
              value={profile.age}
            />
          </label>
        </div>
      </section>
      <section className="settings-panel">
        <h2>알림 설정</h2>
        <label className="setting-row">
          식사 기록 알림 시간
          <input
            onChange={(event) => setProfile({ ...profile, mealReminder: event.target.value })}
            type="time"
            value={profile.mealReminder}
          />
        </label>
      </section>
      <section className="notice-panel">
        <h2>서비스 안내</h2>
        <p>본 서비스는 질병을 진단하거나 치료 식단을 제공하지 않습니다.</p>
        <button className="notice-link" onClick={() => setShowAbout(true)} type="button">
          서비스 소개 보기 →
        </button>
      </section>
      <section className="settings-panel">
        <h2>초기화</h2>
        <button onClick={onResetOnboarding} type="button">
          온보딩 다시 보기
        </button>
      </section>
    </div>
  )
}

function QuestionList({
  answers,
  onToggleAnswer,
}: {
  answers: Record<string, boolean>
  onToggleAnswer: (id: string) => void
}) {
  return (
    <div className="stack">
      {categories.map((category) => {
        const categoryQuestions = questions.filter((question) => question.category === category.key)
        const tone = getSurveyTone(category.title)

        return (
          <div className="recheck-group" key={category.key}>
            <p
              className="category-cue"
              style={
                {
                  '--tone': tone.main,
                  '--tone-soft': tone.soft,
                  '--tone-border': tone.border,
                } as CSSProperties
              }
            >
              <i aria-hidden="true" className={category.icon} /> {category.title}
            </p>
            <div className="question-list">
              {categoryQuestions.map((question) => {
                const isChecked = Boolean(answers[question.id])

                return (
                  <button
                    aria-pressed={isChecked}
                    className={`protein-toggle ${isChecked ? 'active' : ''}`}
                    key={question.id}
                    onClick={() => onToggleAnswer(question.id)}
                    type="button"
                  >
                    <span>
                      <strong>{question.text}</strong>
                      <small>{isChecked ? '네, 해당돼요' : '아니요, 해당 안 돼요'}</small>
                    </span>
                    <i aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultCards({
  categoryScores,
  compact = false,
}: {
  categoryScores: CategoryScore[]
  compact?: boolean
}) {
  return (
    <section className={compact ? 'result-grid compact' : 'result-grid'}>
      {categoryScores.map((category) => (
        <article className="result-card" key={category.key}>
          <div className="result-card-head">
            <span className="category-icon">
              <i aria-hidden="true" className={category.icon} />
            </span>
            <h2>{category.title}</h2>
            <strong className={getLevelClassName(category.level)}>{category.level}</strong>
          </div>
          <p>{category.summary}</p>
        </article>
      ))}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function BottomNav({
  activeTab,
  onChangeTab,
}: {
  activeTab: MainTab
  onChangeTab: (tab: MainTab) => void
}) {
  const tabs: Array<[MainTab, string, string]> = [
    ['home', '홈', 'ti ti-home'],
    ['meals', '식사', 'ti ti-soup'],
    ['check', '점검', 'ti ti-clipboard-check'],
    ['guide', '가이드', 'ti ti-book-2'],
    ['settings', '설정', 'ti ti-settings'],
  ]

  return (
    <nav className="bottom-nav" aria-label="하단 탭 네비게이션">
      {tabs.map(([id, label, icon]) => (
        <button
          className={activeTab === id ? 'active' : ''}
          key={id}
          onClick={() => onChangeTab(id)}
          type="button"
        >
          <i aria-hidden="true" className={icon} />
          {label}
        </button>
      ))}
    </nav>
  )
}

function getTabTitle(tab: MainTab) {
  const titles: Record<MainTab, string> = {
    home: '홈',
    meals: '식사 기록',
    check: '식습관 점검',
    guide: '식사 가이드',
    settings: '설정',
  }

  return titles[tab]
}

function getTodayInputValue() {
  return new Date().toLocaleDateString('sv-SE')
}

function formatKoreanDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    year: 'numeric',
  }).format(date)
}

function getSurveyTone(scope: string) {
  const tones: Record<string, { main: string; soft: string; border: string }> = {
    '혈압 관리': { main: '#a65f48', soft: '#f5e7df', border: '#e3c3b5' },
    '혈당 관리': { main: '#7763a8', soft: '#ece8f7', border: '#cbc2e5' },
    '근육 건강': { main: '#3f7b5a', soft: '#e6f2ea', border: '#bdd8c6' },
    '영양 보충': { main: '#9a743c', soft: '#f3eadb', border: '#dcc59f' },
    '장 건강': { main: '#427f8c', soft: '#e4f1f3', border: '#b9d6dc' },
  }

  return tones[scope] ?? tones['근육 건강']
}

function isConcerningAnswer(question: Question, answer: boolean | undefined) {
  if (answer === undefined) return false
  return question.positive ? answer === false : answer === true
}

function getHabitSummary(category: CategoryKey, checked: number) {
  if (checked === 0) {
    const summaries: Record<CategoryKey, string> = {
      pressure: '현재 식습관에서 크게 점검이 필요한 부분은 보이지 않아요.',
      glucose: '현재 식습관에서 크게 점검이 필요한 부분은 보이지 않아요.',
      muscle: '현재 식습관에서 크게 점검이 필요한 부분은 보이지 않아요.',
      nutrition: '현재 식습관에서 크게 점검이 필요한 부분은 보이지 않아요.',
      gut: '현재 식습관에서 크게 점검이 필요한 부분은 보이지 않아요.',
    }

    return summaries[category]
  }

  const summaries: Record<CategoryKey, string> = {
    pressure: '짠 음식이나 국물 음식을 자주 드시는 편이에요.',
    glucose: '단 음료나 간식 섭취가 자주 있는 편이에요.',
    muscle: '단백질 섭취나 활동량을 점검해보면 좋아요.',
    nutrition: '식사량이나 체중 변화를 함께 살펴보면 좋아요.',
    gut: '수분·식이섬유 섭취와 배변 상태를 함께 점검해보면 좋아요.',
  }

  return summaries[category]
}

function getLevelClassName(level: CategoryScore['level']) {
  if (level === '양호') return 'level-badge good'
  if (level === '점검 필요') return 'level-badge reference'
  return 'level-badge attention'
}

export default App
