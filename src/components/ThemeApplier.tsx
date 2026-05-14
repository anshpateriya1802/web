"use client"

import { useEffect } from "react"
import { useRoomStore } from "@/stores/roomStore"

/**
 * Syncs the Zustand theme state to the <html> element's class list so that
 * all CSS variables (html.light { ... }) are applied globally.
 * Mount this once inside the root layout body.
 */
export default function ThemeApplier() {
  const theme = useRoomStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    if (theme === "light") {
      html.classList.add("light")
    } else {
      html.classList.remove("light")
    }
  }, [theme])

  return null  // renders nothing — side-effect only
}
