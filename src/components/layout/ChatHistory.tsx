'use client'

import { useState } from 'react'
import CompanyModal from '../modals/CompanyModal'

interface NavigationButton {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick: () => void;
}

export default function ChatHistory() {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  const navigationButtons: NavigationButton[] = [
    {
      title: 'My Company',
      description: 'View and manage your company information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      onClick: () => setIsCompanyModalOpen(true)
    },
    {
      title: 'My Customers',
      description: 'Access your customer database',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => {}
    },
    {
      title: 'My Campaigns',
      description: 'Track your marketing campaigns',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      onClick: () => {}
    }
  ]

  return (
    <>
      <div className="w-[360px] p-6 space-y-4">
        {navigationButtons.map((button, index) => (
          <button
            key={index}
            className="group w-full"
            onClick={button.onClick}
          >
            <div className="feature-card">
              <div className="feature-card-icon">
                {button.icon}
              </div>
              <div className="feature-card-content">
                <h3 className="feature-card-title">
                  {button.title}
                </h3>
                <p className="feature-card-description">
                  {button.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </>
  )
}
