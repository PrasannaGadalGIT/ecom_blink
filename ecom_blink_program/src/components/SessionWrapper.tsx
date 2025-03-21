"use client"
import { SessionProvider } from "next-auth/react"
import React, { ReactNode } from "react"

interface SessionWrapper{
  children : ReactNode
}

const SessionWrapper : React.FC<SessionWrapper> = ({children}) => {
  return (
    <SessionProvider>{children}</SessionProvider>
  )
}

export default SessionWrapper