import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import * as faceapi from '@vladmandic/face-api'

const EXPRESSION_EMOJI = {
  happy: '😊',
  neutral: '😐',
  surprised: '😮',
  fearful: '😰',
  disgusted: '😒',
  angry: '😠',
  sad: '😔',
}

const EXPRESSION_LABEL = {
  happy: 'Happy',
  neutral: 'Neutral',
  surprised: 'Surprised',
  fearful: 'Nervous',
  disgusted: 'Uncomfortable',
  angry: 'Tense',
  sad: 'Sad',
}

const CONFIDENCE_MAP = {
  happy: 'HIGH',
  neutral: 'MEDIUM',
  surprised: 'MEDIUM',
  fearful: 'LOW',
  disgusted: 'LOW',
  angry: 'LOW',
  sad: 'LOW',
}

// ExpressionTracker: renders a floating camera window
// exposes getSummary() via ref to get expression data at the end
const ExpressionTracker = forwardRef(({ isActive }, ref) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const expressionLogRef = useRef([]) // array of {expression, confidence, timestamp}

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [currentExpression, setCurrentExpression] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [loadingModels, setLoadingModels] = useState(true)

  // Load face-api models from CDN
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        setLoadingModels(false)
      } catch (err) {
        console.error('Failed to load face-api models:', err)
        setCameraError('Failed to load expression models')
        setLoadingModels(false)
      }
    }
    loadModels()
    return () => stopCamera()
  }, [])

  // Start camera when models loaded and active
  useEffect(() => {
    if (modelsLoaded && isActive) {
      startCamera()
    } else if (!isActive) {
      stopCamera()
    }
  }, [modelsLoaded, isActive])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          startDetection()
        }
      }
    } catch (err) {
      setCameraError('Camera access denied')
    }
  }

  const stopCamera = () => {
    clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused) return
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (detection) {
          const expressions = detection.expressions
          const dominant = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)
          const [expr, confidence] = dominant

          setCurrentExpression({ expression: expr, confidence })
          expressionLogRef.current.push({
            expression: expr,
            confidence,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        // silently ignore detection errors
      }
    }, 2000) // detect every 2 seconds
  }

  // Expose getSummary() to parent
  useImperativeHandle(ref, () => ({
    getSummary: () => {
      const log = expressionLogRef.current
      if (log.length === 0) return null

      // Count occurrences of each expression
      const counts = {}
      log.forEach(({ expression }) => {
        counts[expression] = (counts[expression] || 0) + 1
      })

      // Calculate percentages
      const total = log.length
      const percentages = {}
      Object.entries(counts).forEach(([expr, count]) => {
        percentages[expr] = Math.round((count / total) * 100)
      })

      // Dominant expression
      const dominant = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0]

      // Overall confidence assessment
      const confidentReadings = log.filter(l => ['happy', 'neutral'].includes(l.expression)).length
      const confidenceLevel = confidentReadings / total >= 0.6 ? 'HIGH' : confidentReadings / total >= 0.35 ? 'MEDIUM' : 'LOW'

      return {
        dominant,
        percentages,
        confidenceLevel,
        totalReadings: total,
        log: log.slice(-20), // last 20 readings
      }
    },
    reset: () => {
      expressionLogRef.current = []
      setCurrentExpression(null)
    }
  }))

  if (cameraError) return null // silently fail — don't break the interview

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1000,
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(249,115,22,0.3)',
      background: 'var(--card)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: isMinimized ? 140 : 280,
      transition: 'width 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: 'rgba(249,115,22,0.1)',
        borderBottom: '1px solid rgba(249,115,22,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#f97316' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#f97316' : '#666', animation: isActive ? 'pulse 1.5s infinite' : 'none' }} />
          {isMinimized ? 'Cam' : 'Expression Cam'}
        </div>
        <button
          onClick={() => setIsMinimized(m => !m)}
          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
        >
          {isMinimized ? '□' : '—'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Video */}
          <div style={{ position: 'relative', background: '#000' }}>
            {loadingModels && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: '#111', zIndex: 2,
                fontSize: 12, color: 'var(--text3)', gap: 8,
              }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
                Loading models...
              </div>
            )}
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'none' }} />
          </div>

          {/* Current expression */}
          <div style={{ padding: '10px 12px' }}>
            {currentExpression ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{EXPRESSION_EMOJI[currentExpression.expression] || '😐'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {EXPRESSION_LABEL[currentExpression.expression] || currentExpression.expression}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {Math.round(currentExpression.confidence * 100)}% confidence
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: CONFIDENCE_MAP[currentExpression.expression] === 'HIGH' ? 'rgba(0,255,136,0.1)' : CONFIDENCE_MAP[currentExpression.expression] === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(255,68,102,0.1)',
                  color: CONFIDENCE_MAP[currentExpression.expression] === 'HIGH' ? 'var(--green)' : CONFIDENCE_MAP[currentExpression.expression] === 'MEDIUM' ? 'var(--yellow)' : 'var(--red)',
                }}>
                  {CONFIDENCE_MAP[currentExpression.expression]}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                {loadingModels ? 'Loading...' : 'No face detected'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Minimized expression */}
      {isMinimized && currentExpression && (
        <div style={{ padding: '6px 12px', fontSize: 18, textAlign: 'center' }}>
          {EXPRESSION_EMOJI[currentExpression.expression] || '😐'}
        </div>
      )}
    </div>
  )
})

ExpressionTracker.displayName = 'ExpressionTracker'
export default ExpressionTracker