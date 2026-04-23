"use client";

import { usePrivy } from "@privy-io/react-auth";

export function usePayment() {
  const { login, logout, user, ready, authenticated } = usePrivy();

  return {
    login,
    logout,
    user,
    isReady: ready,
    isAuthenticated: authenticated,
  };
}