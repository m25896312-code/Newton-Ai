import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Problem } from '../lib/supabase'
import '../styles/Home.css'

export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProblem, setShowNewProblem] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadProblems()
  }, [])

  const loadProblems = async () => {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProblems(data)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <h1>Newton-Ai</h1>
            <p>هتحل وتفهم</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowNewProblem(true)} className="new-problem-btn">
              مسألة جديدة +
            </button>
            <button onClick={handleSignOut} className="sign-out-btn">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="content-wrapper">
          <div className="section-header">
            <h2>مسائلك</h2>
            <p>جميع المسائل التي قمت بحلها</p>
          </div>

          {loading ? (
            <div className="loading">جاري التحميل...</div>
          ) : problems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>لا توجد مسائل بعد</h3>
              <p>ابدأ بإضافة أول مسألة لك</p>
              <button onClick={() => setShowNewProblem(true)} className="cta-btn">
                أضف مسألة جديدة
              </button>
            </div>
          ) : (
            <div className="problems-grid">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="problem-card"
                  onClick={() => navigate(`/problem/${problem.id}`)}
                >
                  <div className="problem-header">
                    <h3>{problem.title}</h3>
                    <span className={`status-badge ${problem.status}`}>
                      {problem.status === 'solved' ? 'محلولة' : 'قيد الحل'}
                    </span>
                  </div>
                  <p className="problem-description">{problem.description}</p>
                  <div className="problem-meta">
                    <span className="meta-item">{problem.subject}</span>
                    <span className="meta-item">{problem.grade_level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showNewProblem && (
        <NewProblemModal
          onClose={() => setShowNewProblem(false)}
          onSuccess={() => {
            setShowNewProblem(false)
            loadProblems()
          }}
          userId={user?.id || ''}
        />
      )}
    </div>
  )
}

function NewProblemModal({ onClose, onSuccess, userId }: { onClose: () => void, onSuccess: () => void, userId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('رياضيات')
  const [gradeLevel, setGradeLevel] = useState('الثانوية العامة')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: insertError } = await supabase
      .from('problems')
      .insert({
        user_id: userId,
        title,
        description,
        subject,
        grade_level: gradeLevel,
        status: 'pending'
      })

    if (insertError) {
      setError('حدث خطأ أثناء إضافة المسألة')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>إضافة مسألة جديدة</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">عنوان المسألة</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="مثال: حل معادلة من الدرجة الثانية"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">وصف المسألة</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="اكتب تفاصيل المسألة هنا..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">المادة</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="رياضيات">رياضيات</option>
                <option value="فيزياء">فيزياء</option>
                <option value="كيمياء">كيمياء</option>
                <option value="أحياء">أحياء</option>
                <option value="علوم">علوم</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="gradeLevel">المرحلة الدراسية</label>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
              >
                <option value="ابتدائي">ابتدائي</option>
                <option value="إعدادي">إعدادي</option>
                <option value="ثانوي">ثانوي</option>
                <option value="الثانوية العامة">الثانوية العامة</option>
                <option value="جامعي">جامعي</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'جاري الإضافة...' : 'إضافة المسألة'}
          </button>
        </form>
      </div>
    </div>
  )
}
