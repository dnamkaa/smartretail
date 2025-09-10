"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SmartRetail...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <LoginForm />;
}