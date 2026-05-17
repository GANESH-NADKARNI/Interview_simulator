import { useRef, useState, useCallback } from 'react'
import api from '../services/api'

// Returns real-time audio metrics + Groq Whisper transcription
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [duration, setDuration] = useState(0)

  // Real-time audio metrics
  const [volume, setVolume] = useState(0)          // 0-100 current volume
  const [avgVolume, setAvgVolume] = useState(0)    // average over session
  const [peakVolume, setPeakVolume] = useState(0)  // peak volume
  const [pauseCount, setPauseCount] = useState(0)  // number of pauses detected
  const [wordCount, setWordCount] = useState(0)    // estimated from duration + pace

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const volumeSamplesRef = useRef([])
  const pauseStartRef = useRef(null)
  const isPausedRef = useRef(false)
  const pauseCountRef = useRef(0)

  const PAUSE_THRESHOLD = 22     // volume below this = silence — calibrated: speech ~24-31%, silence ~12-18%
  const PAUSE_MIN_DURATION = 600 // ms of silence to count as a pause (600ms catches natural sentence gaps)

  const startRecording = useCallback(async () => {
    try {
      // Sensitivity-friendly: AGC boosts quiet mics, no suppression so normal speech isn't filtered
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: 44100,
        }
      })
      streamRef.current = stream

      // ── Web Audio API setup ──
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024              // finer resolution — catches quiet speech better
      analyser.smoothingTimeConstant = 0.6 // smooths flicker without lag

      // 2.5× signal boost so normal speech registers clearly on the meter
      // NOT connected to destination — zero echo/feedback risk
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 2.5

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(gainNode)
      gainNode.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Real-time volume polling
      volumeSamplesRef.current = []
      pauseCountRef.current = 0
      isPausedRef.current = false
      pauseStartRef.current = null

      const pollVolume = () => {
        analyser.getByteFrequencyData(dataArray)
        // Only lower 60% of bins = voice frequencies (80Hz–8kHz)
        // Full average drags value down with silent ultrasonic bins
        const voiceBins = dataArray.slice(0, Math.floor(dataArray.length * 0.6))
        const avg = voiceBins.reduce((a, b) => a + b, 0) / voiceBins.length
        const vol = Math.round((avg / 255) * 100)

        setVolume(vol)
        volumeSamplesRef.current.push(vol)

        // Running average
        const runningAvg = Math.round(volumeSamplesRef.current.reduce((a, b) => a + b, 0) / volumeSamplesRef.current.length)
        setAvgVolume(runningAvg)

        // Peak
        setPeakVolume(prev => Math.max(prev, vol))

        // Pause detection
        if (vol < PAUSE_THRESHOLD) {
          if (!isPausedRef.current) {
            isPausedRef.current = true
            pauseStartRef.current = Date.now()
          } else if (Date.now() - pauseStartRef.current > PAUSE_MIN_DURATION) {
            // Only count once per pause event
            if (pauseStartRef.current !== null) {
              pauseCountRef.current += 1
              setPauseCount(pauseCountRef.current)
              pauseStartRef.current = null // reset so we don't double count
            }
          }
        } else {
          isPausedRef.current = false
          pauseStartRef.current = null
        }

        animFrameRef.current = requestAnimationFrame(pollVolume)
      }
      pollVolume()

      // ── MediaRecorder setup ──
      audioChunksRef.current = []
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // collect in 100ms chunks

      // Timer
      startTimeRef.current = Date.now()
      setDuration(0)
      setPauseCount(0)
      setPeakVolume(0)
      setAvgVolume(0)
      setVolume(0)
      setWordCount(0)

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(secs)
        // Rough word count estimate: avg 130 wpm = ~2.17 words/sec
        setWordCount(Math.round(secs * 2.17))
      }, 1000)

      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      throw err
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      cancelAnimationFrame(animFrameRef.current)
      clearInterval(timerRef.current)

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const mimeType = getSupportedMimeType() || 'audio/webm'
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          resolve(blob)
        }
        mediaRecorderRef.current.stop()
      } else {
        resolve(null)
      }

      // Stop tracks
      streamRef.current?.getTracks().forEach(t => t.stop())
      audioContextRef.current?.close()
      setIsRecording(false)
      setVolume(0)
    })
  }, [])

  const transcribeAudio = useCallback(async (audioBlob) => {
    if (!audioBlob) return ''
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      // Always send as webm — Groq supports it
      formData.append('audio', audioBlob, 'recording.webm')
      const { data } = await api.post('/hr/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data.transcript || ''
    } catch (err) {
      console.error('Transcription failed:', err)
      throw err
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // Get analytics summary for the final report
  const getVoiceAnalytics = useCallback(() => {
    const durationSecs = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
    return {
      durationSeconds: durationSecs,
      avgVolume,
      peakVolume,
      pauseCount: pauseCountRef.current,
      // Will be recalculated from actual transcript word count
      estimatedWPM: durationSecs > 0 ? Math.round((wordCount / durationSecs) * 60) : 0,
    }
  }, [avgVolume, peakVolume, wordCount])

  return {
    isRecording,
    isTranscribing,
    duration,
    volume,
    avgVolume,
    peakVolume,
    pauseCount,
    wordCount,
    startRecording,
    stopRecording,
    transcribeAudio,
    getVoiceAnalytics,
  }
}

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
}