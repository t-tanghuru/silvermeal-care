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
    icon: '🫀',
    short: '나트륨, 짠 음식, 국물 음식 습관 확인',
    detail: '혈압 관리가 걱정된다면 짠 음식, 국물 음식, 가공식품 섭취 빈도를 점검합니다.',
    nutrients: ['나트륨', '칼륨'],
    habits: ['짠 음식', '국물 음식', '가공식품'],
    guide: '국물 섭취를 줄이고, 음식 간을 조금 싱겁게 조절하는 습관부터 확인해보세요.',
  },
  {
    key: 'glucose',
    title: '혈당 관리',
    icon: '🍚',
    short: '탄수화물, 당류, 간식 섭취 균형 확인',
    detail: '혈당 관리가 걱정된다면 단 음료, 간식, 흰쌀밥이나 면 위주의 식사 빈도를 점검합니다.',
    nutrients: ['탄수화물', '당류', '식이섬유'],
    habits: ['단 음료', '간식', '식사 균형'],
    guide: '탄수화물 위주의 식사에 채소와 단백질 식품을 함께 구성해보세요.',
  },
  {
    key: 'muscle',
    title: '근육 건강',
    icon: '💪',
    short: '단백질 섭취와 활동량 확인',
    detail: '근육 건강이 걱정되는 경우 단백질 식품 섭취와 활동량을 함께 점검합니다.',
    nutrients: ['단백질', '비타민 D', '칼슘'],
    habits: ['단백질 식품 섭취', '활동량', '체중 변화'],
    guide: '매 끼니 단백질 식품을 포함하고, 가능한 범위에서 규칙적인 활동을 이어가보세요.',
  },
  {
    key: 'nutrition',
    title: '영양 보충',
    icon: '🥣',
    short: '식사량, 체중 변화, 식욕 저하 확인',
    detail: '식사량이 줄거나 체중 변화가 있다면 열량과 단백질 섭취를 함께 점검합니다.',
    nutrients: ['열량', '단백질', '수분'],
    habits: ['식사량 변화', '식욕', '체중 변화'],
    guide: '식사량이 적은 날에는 소량의 간식이나 단백질 식품을 나누어 챙겨보세요.',
  },
  {
    key: 'gut',
    title: '장 건강',
    icon: '💧',
    short: '수분, 식이섬유, 배변 상태 확인',
    detail: '배변이 불편하거나 수분 섭취가 적다면 물과 식이섬유 섭취 습관을 점검합니다.',
    nutrients: ['수분', '식이섬유'],
    habits: ['수분 섭취', '채소/과일 섭취', '배변 상태'],
    guide: '물 섭취와 채소, 과일, 잡곡 등 식이섬유가 있는 식품을 함께 확인해보세요.',
  },
]

const surveyScope = ['혈압', '혈당', '단백질', '수분', '체중', '장 건강']

const questions: Question[] = [
  { id: 'q1', category: 'pressure', stepLabel: '혈압', text: '짠 음식을 자주 먹는 편인가요?' },
  { id: 'q2', category: 'pressure', stepLabel: '혈압', text: '국물 음식이나 가공식품을 자주 먹나요?' },
  { id: 'q3', category: 'glucose', stepLabel: '혈당', text: '단 음료나 단 간식을 자주 먹는 편인가요?' },
  { id: 'q4', category: 'glucose', stepLabel: '혈당', text: '흰쌀밥, 빵, 면 위주의 식사가 많은 편인가요?' },
  { id: 'q5', category: 'muscle', stepLabel: '단백질', text: '단백질 식품을 자주 섭취하지 않는 편인가요?' },
  { id: 'q6', category: 'muscle', stepLabel: '단백질', text: '최근 활동량이 줄었다고 느끼나요?' },
  { id: 'q7', category: 'muscle', stepLabel: '단백질', text: '걷기나 계단 오르기가 예전보다 힘들게 느껴지나요?' },
  { id: 'q8', category: 'gut', stepLabel: '수분', text: '물을 적게 마시는 편인가요?' },
  { id: 'q9', category: 'gut', stepLabel: '수분', text: '하루 동안 물을 따로 챙겨 마시는 일이 적은 편인가요?' },
  { id: 'q10', category: 'nutrition', stepLabel: '체중', text: '최근 식사량이 줄었다고 느끼나요?' },
  { id: 'q11', category: 'nutrition', stepLabel: '체중', text: '최근 체중이 감소했거나 식욕이 떨어졌나요?' },
  { id: 'q12', category: 'gut', stepLabel: '장 건강', text: '채소나 과일을 적게 먹는 편인가요?' },
  { id: 'q13', category: 'gut', stepLabel: '장 건강', text: '배변이 원활하지 않다고 느끼나요?' },
  { id: 'q14', category: 'gut', stepLabel: '장 건강', text: '잡곡, 콩류, 해조류 같은 식이섬유 식품을 적게 먹는 편인가요?' },
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
      const checkedQuestions = questions
        .filter((question) => question.category === category.key)
        .filter((question) => answers[question.id])
      const level =
        checkedQuestions.length >= 3 ? '관리 참고' : checkedQuestions.length >= 1 ? '점검 필요' : '양호'

      return {
        ...category,
        checked: checkedQuestions.length,
        level,
        summary: getHabitSummary(category.key, checkedQuestions.length),
        reasons: checkedQuestions.map((question) => question.text),
      }
    })
  }, [answers])

  const weeklySummary = useMemo(() => {
    const averageMeal =
      logs.reduce((sum, log) => sum + amountScore[log.amount], 0) / Math.max(logs.length, 1)
    const totalWater = logs.reduce((sum, log) => sum + log.water, 0)
    const proteinMeals = logs.filter((log) => log.protein).length

    return {
      averageMeal,
      totalWater,
      proteinMeals,
      needsMealCheck: averageMeal < 0.7,
      needsWaterCheck: totalWater < 1500,
      needsProteinCheck: proteinMeals < Math.ceil(logs.length / 2),
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
        <div>
          <p className="eyebrow">SilverMeal Care</p>
          <h1>{getTabTitle(activeTab)}</h1>
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
            <p className="survey-meta">약 3분 · 14개 항목</p>
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
  const meals = ['아침', '점심', '저녁']
  const todayLogs = logs.filter((log) => log.date === today)
  const recordedMeals = meals.filter((meal) => todayLogs.some((log) => log.meal === meal))
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
          <div>
            <h2>오늘 식사 기록</h2>
            <p>{recordedMeals.length > 0 ? `${recordedMeals.length}끼 기록됨` : '아직 기록된 식사가 없어요'}</p>
          </div>
          <button className="primary-button" onClick={() => onMoveTab('meals')} type="button">
            식사 입력
          </button>
        </div>
        <div className="meal-status-grid">
          {meals.map((meal) => {
            const isRecorded = recordedMeals.includes(meal)

            return (
              <article className={isRecorded ? 'recorded' : ''} key={meal}>
                <strong>{meal}</strong>
                <span>{isRecorded ? '기록 완료' : '미기록'}</span>
              </article>
            )
          })}
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
          label="평균 식사량"
          value={logs.length > 0 ? `${Math.round(weeklySummary.averageMeal * 100)}%` : '-'}
        />
        <Metric label="기록 수분량" value={logs.length > 0 ? `${weeklySummary.totalWater}ml` : '-'} />
        <Metric
          label="단백질 포함"
          value={logs.length > 0 ? `${weeklySummary.proteinMeals}/${logs.length}회` : '-'}
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
        <h2>이번 주 점검 메모</h2>
        <ul>
          {logs.length === 0 && <li>식사 기록이 쌓이면 주간 점검 메모가 표시됩니다.</li>}
          {logs.length > 0 && weeklySummary.needsMealCheck && (
            <li>최근 식사량이 낮게 나타나 식사량 변화를 확인해보세요.</li>
          )}
          {logs.length > 0 && weeklySummary.needsWaterCheck && (
            <li>기록된 수분 섭취량이 낮아 섭취 가능한 수분원을 확인해보세요.</li>
          )}
          {logs.length > 0 && weeklySummary.needsProteinCheck && (
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
            <summary>{formatKoreanDate(draftLog.date)}</summary>
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
            <span className="category-icon">{selectedCategory.icon}</span>
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
            <span className="category-icon">{category.icon}</span>
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
    <div className="question-list">
      {questions.map((question) => (
        <label className="question-item" key={question.id}>
          <input
            checked={Boolean(answers[question.id])}
            onChange={() => onToggleAnswer(question.id)}
            type="checkbox"
          />
          <span>{question.text}</span>
        </label>
      ))}
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
            <span className="category-icon">{category.icon}</span>
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
    ['home', '홈', '🏠'],
    ['meals', '식사', '🍚'],
    ['check', '점검', '📋'],
    ['guide', '가이드', '📖'],
    ['settings', '설정', '⚙️'],
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
          <span>{icon}</span>
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
    혈압: { main: '#a65f48', soft: '#f5e7df', border: '#e3c3b5' },
    혈당: { main: '#7763a8', soft: '#ece8f7', border: '#cbc2e5' },
    단백질: { main: '#3f7b5a', soft: '#e6f2ea', border: '#bdd8c6' },
    수분: { main: '#427f8c', soft: '#e4f1f3', border: '#b9d6dc' },
    체중: { main: '#9a743c', soft: '#f3eadb', border: '#dcc59f' },
    '장 건강': { main: '#43806d', soft: '#e3f0eb', border: '#b8d5ca' },
  }

  return tones[scope] ?? tones['단백질']
}

function getHabitSummary(category: CategoryKey, checked: number) {
  if (checked === 0) {
    const summaries: Record<CategoryKey, string> = {
      pressure: '짠 음식과 국물 섭취는 비교적 안정적으로 보여요.',
      glucose: '단 음료와 탄수화물 섭취 균형은 비교적 안정적으로 보여요.',
      muscle: '단백질 섭취와 활동 습관은 비교적 안정적으로 보여요.',
      nutrition: '식사량과 체중 변화는 비교적 안정적으로 보여요.',
      gut: '수분과 장 건강 관련 습관은 비교적 안정적으로 보여요.',
    }

    return summaries[category]
  }

  const summaries: Record<CategoryKey, string> = {
    pressure: '짠 음식·국물 섭취가 잦은 편이에요.',
    glucose: '단 음료·탄수화물 위주 식사가 잦은 편이에요.',
    muscle: '단백질 섭취나 활동량을 점검해보면 좋아요.',
    nutrition: '식사량·체중 변화가 신경 쓰이는 흐름이에요.',
    gut: '수분·식이섬유 섭취와 배변 상태를 함께 점검해보면 좋아요.',
  }

  return summaries[category]
}

function getLevelClassName(level: CategoryScore['level']) {
  if (level === '양호') return 'level-badge good'
  if (level === '관리 참고') return 'level-badge reference'
  return 'level-badge attention'
}

export default App
