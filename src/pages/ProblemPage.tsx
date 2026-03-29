import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Problem, Solution } from '../lib/supabase'
import '../styles/Problem.css'

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [solution, setSolution] = useState<Solution | null>(null)
  const [loading, setLoading] = useState(true)
  const [solving, setSolving] = useState(false)

  useEffect(() => {
    loadProblem()
  }, [id])

  const loadProblem = async () => {
    if (!id) return

    const { data: problemData, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (problemError || !problemData) {
      navigate('/')
      return
    }

    setProblem(problemData)

    const { data: solutionData } = await supabase
      .from('solutions')
      .select('*')
      .eq('problem_id', id)
      .maybeSingle()

    if (solutionData) {
      setSolution(solutionData)
    }

    setLoading(false)
  }

  const handleSolve = async () => {
    if (!problem) return

    setSolving(true)

    const mockSolution = {
      problem_id: problem.id,
      content: `الحل التفصيلي للمسألة: ${problem.title}

نبدأ بتحليل المسألة وفهم المطلوب، ثم نطبق القوانين والمفاهيم المناسبة.

في هذه المسألة: ${problem.description}

خطوات الحل:
1. تحديد المعطيات والمطلوب
2. اختيار القانون المناسب
3. التعويض في القانون
4. إجراء العمليات الحسابية
5. التحقق من النتيجة

النتيجة النهائية: [الإجابة]`,
      steps: [
        {
          step_number: 1,
          description: 'تحديد المعطيات والمطلوب',
          explanation: 'نقوم بقراءة المسألة بعناية ونحدد جميع المعطيات المذكورة والمطلوب إيجاده'
        },
        {
          step_number: 2,
          description: 'اختيار القانون المناسب',
          explanation: 'نختار القانون أو النظرية المناسبة التي تربط المعطيات بالمطلوب'
        },
        {
          step_number: 3,
          description: 'التعويض في القانون',
          explanation: 'نعوض بقيم المعطيات في القانون المختار'
        },
        {
          step_number: 4,
          description: 'إجراء العمليات الحسابية',
          explanation: 'نقوم بإجراء العمليات الحسابية خطوة بخطوة للوصول للنتيجة'
        },
        {
          step_number: 5,
          description: 'التحقق من النتيجة',
          explanation: 'نتحقق من منطقية النتيجة ومطابقتها للوحدات المطلوبة'
        }
      ]
    }

    const { data: solutionData, error } = await supabase
      .from('solutions')
      .insert(mockSolution)
      .select()
      .single()

    if (!error && solutionData) {
      await supabase
        .from('problems')
        .update({ status: 'solved' })
        .eq('id', problem.id)

      setSolution(solutionData)
      setProblem({ ...problem, status: 'solved' })
    }

    setSolving(false)
  }

  if (loading) {
    return (
      <div className="problem-loading">
        جاري التحميل...
      </div>
    )
  }

  if (!problem) {
    return null
  }

  return (
    <div className="problem-container">
      <header className="problem-header">
        <div className="header-content">
          <button onClick={() => navigate('/')} className="back-btn">
            ← الرجوع
          </button>
          <div className="logo-small">
            <h1>Newton-Ai</h1>
          </div>
        </div>
      </header>

      <main className="problem-main">
        <div className="problem-content">
          <div className="problem-card">
            <div className="card-header">
              <div>
                <h1>{problem.title}</h1>
                <div className="problem-meta-tags">
                  <span className="meta-tag">{problem.subject}</span>
                  <span className="meta-tag">{problem.grade_level}</span>
                  <span className={`status-tag ${problem.status}`}>
                    {problem.status === 'solved' ? 'محلولة' : 'قيد الحل'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body">
              <h3>وصف المسألة</h3>
              <p className="problem-text">{problem.description}</p>

              {!solution && (
                <button
                  onClick={handleSolve}
                  disabled={solving}
                  className="solve-btn"
                >
                  {solving ? 'جاري الحل...' : 'حل المسألة'}
                </button>
              )}
            </div>
          </div>

          {solution && (
            <div className="solution-card">
              <div className="solution-header">
                <h2>الحل التفصيلي</h2>
              </div>

              <div className="solution-body">
                <div className="solution-steps">
                  <h3>خطوات الحل</h3>
                  {solution.steps.map((step: any, index: number) => (
                    <div key={index} className="step-item">
                      <div className="step-number">{step.step_number}</div>
                      <div className="step-content">
                        <h4>{step.description}</h4>
                        <p>{step.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="solution-full">
                  <h3>الشرح الكامل</h3>
                  <div className="solution-text">
                    {solution.content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
