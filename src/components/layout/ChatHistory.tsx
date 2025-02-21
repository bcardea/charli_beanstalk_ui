'use client'

import Image from 'next/image'

interface NavigationButton {
  title: string;
  imageUrl: string;
  href: string;
  description: string;
}

export default function ChatHistory() {
  const navigationButtons: NavigationButton[] = [
    {
      title: 'My Company',
      description: 'Manage and analyze your business data',
      imageUrl: 'https://picsum.photos/800/400?random=1',
      href: '/company'
    },
    {
      title: 'My Target Market',
      description: 'Explore market trends and opportunities',
      imageUrl: 'https://picsum.photos/800/400?random=2',
      href: '/market'
    },
    {
      title: 'Past Campaigns',
      description: 'Review and optimize your campaigns',
      imageUrl: 'https://picsum.photos/800/400?random=3',
      href: '/campaigns'
    }
  ]

  return (
    <div className="w-[360px] bg-white/10 backdrop-blur-md">
      <div className="p-6 pt-8 space-y-6">
        {navigationButtons.map((button, index) => (
          <button
            key={index}
            className="relative w-full h-44 rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          >
            {/* Background Image */}
            <Image
              src={button.imageUrl}
              alt={button.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80 transition-opacity duration-300 group-hover:opacity-90" />
            
            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end transform transition-transform duration-300 group-hover:translate-y-0">
              <h3 className="text-2xl font-semibold text-white mb-2 drop-shadow-lg">
                {button.title}
              </h3>
              <p className="text-white/80 text-sm transform transition-all duration-300 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                {button.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
