import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

interface Section {
  type: 'H1' | 'H2' | 'Body';
  content: string;
}

export default function FormattedMessage({ content, role }: FormattedMessageProps) {
  // User messages are simple text
  if (role === 'user') {
    return (
      <div className="chat-message chat-message-user">
        {content}
      </div>
    );
  }

  // Try to parse JSON from markdown code block
  try {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const jsonContent = JSON.parse(jsonMatch[1]);
      const sections: Section[] = [];

      // Parse the JSON into ordered sections
      Object.entries(jsonContent).forEach(([key, value]) => {
        if (typeof value === 'string') {
          sections.push({ type: key as 'H1' | 'H2' | 'Body', content: value });
        }
      });

      return (
        <div className="chat-message chat-message-assistant">
          {sections.map((section, index) => {
            switch (section.type) {
              case 'H1':
                return (
                  <div key={index} className="mb-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {section.content}
                    </h1>
                    <div className="h-px bg-gradient-to-r from-[--primary] to-transparent mt-2 opacity-20" />
                  </div>
                );
              case 'H2':
                return (
                  <div key={index} className="mb-3 mt-5">
                    <h2 className="text-lg font-semibold text-[--text] opacity-90">
                      {section.content}
                    </h2>
                  </div>
                );
              case 'Body':
                return (
                  <div key={index} className="text-[--text] opacity-80 space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-1.5 ml-1">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="flex items-start">
                            <span className="text-[--primary] mr-2 mt-1.5">•</span>
                            <span>{children}</span>
                          </li>
                        ),
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      );
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }

  // Fallback for regular text messages
  return (
    <div className="chat-message chat-message-assistant">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="leading-relaxed text-[--text] opacity-80">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 ml-1">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start text-[--text] opacity-80">
              <span className="text-[--primary] mr-2 mt-1.5">•</span>
              <span>{children}</span>
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
