import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })

  let startX = 0
  let startY = 0
  let tracking = false

  const EDGE_THRESHOLD = 20
  const SWIPE_THRESHOLD = 100
  const SWIPE_MAX_Y = 80

  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    if (touch.clientX <= EDGE_THRESHOLD) {
      startX = touch.clientX
      startY = touch.clientY
      tracking = true
    }
  }, { passive: true })

  document.addEventListener('touchmove', (e) => {
    if (!tracking) return
    const touch = e.touches[0]
    const dy = Math.abs(touch.clientY - startY)
    if (dy > SWIPE_MAX_Y) {
      tracking = false
    }
  }, { passive: true })

  document.addEventListener('touchend', (e) => {
    if (!tracking) return
    tracking = false
    const touch = e.changedTouches[0]
    const dx = touch.clientX - startX
    if (dx >= SWIPE_THRESHOLD) {
      const route = router.currentRoute.value
      if (route.path !== '/') {
        router.back()
      }
    }
  }, { passive: true })
})
