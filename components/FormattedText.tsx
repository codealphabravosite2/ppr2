import React, { useMemo } from 'react';
import katex from 'katex';

interface FormattedTextProps {
  text: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  const parts = useMemo(() => {
    // Advanced Regex to capture:
    // 1. Standard Delimiters: $$, \[, \(, $
    // 2. Naked Math Commands
    // 3. Simple Equations
    
    const mathPatterns = [
        /\$\$[\s\S]+?\$\$/,                    // $$...$$ (Display Math)
        /\\\[[\s\S]+?\\\]/,                    // \[...\] (Display Math)
        /\\\([\s\S]+?\\\)/,                    // \(...\) (Inline Math)
        /(?:\$)(?:\\.|[^\$])+(?:\$)/,          // $...$ (Inline Math)
        
        // Naked Equation with Command
        /(?:(?:[a-zA-Z0-9\s\(\)\.]{1,20}=\s*)?\\(?:text|frac|sqrt|sin|cos|tan|Delta|pi|theta|times|alpha|beta|gamma|sum|int|infty)[^$\n<]*?(?=\s{2,}|\sWhere:|\sContext:|\sNote:|$))/,
        
        // Naked Command Only
        /(?:\\(?:text|frac|sqrt|sin|cos|tan|Delta|pi|theta|times|alpha|beta|gamma|sum|int|infty)[^$\n<]*?(?=\s{2,}|\sWhere:|\sContext:|\sNote:|$))/,
        
        // Simple Equations with Exponents/Underscores
        /(?:\b[a-zA-Z]{1,10}\s*=\s*[a-zA-Z0-9\(\)\+\-\*\/]+(?:\^|\_)[a-zA-Z0-9\{\}\(\)\+\-\*\/]+)/, 
        
        // Simple Exponents
        /(?:[a-zA-Z0-9\(\)]+\^[a-zA-Z0-9\{\}]+)/
    ];

    const combinedMathRegex = new RegExp(mathPatterns.map(p => p.source).join('|'), 'g');
    
    const splitParts = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedMathRegex.exec(text)) !== null) {
        // Push preceding text
        if (match.index > lastIndex) {
            splitParts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        
        // Push math content
        splitParts.push({ type: 'math', content: match[0] });
        lastIndex = combinedMathRegex.lastIndex;
    }
    
    // Push remaining text
    if (lastIndex < text.length) {
        splitParts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return splitParts;
  }, [text]);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === 'math') {
          try {
            let rawMath = part.content;
            let displayMode = false;
            
            if (rawMath.startsWith('$$')) { rawMath = rawMath.slice(2, -2); displayMode = true; }
            else if (rawMath.startsWith('\\[')) { rawMath = rawMath.slice(2, -2); displayMode = true; }
            else if (rawMath.startsWith('\\(')) { rawMath = rawMath.slice(2, -2); }
            else if (rawMath.startsWith('$')) { rawMath = rawMath.slice(1, -1); }
            
            rawMath = rawMath.trim();

            const html = katex.renderToString(rawMath, {
              throwOnError: false,
              displayMode: displayMode,
              output: 'html',
              trust: true
            });

            return (
              <span 
                key={index} 
                dangerouslySetInnerHTML={{ __html: html }} 
                className={`formatted-math ${displayMode ? 'block my-4 text-center' : 'inline-block mx-1'}`}
              />
            );
          } catch (e) {
            return <span key={index} className="text-gray-800">{part.content}</span>;
          }
        }
        
        // Process Text for Markdown: Bold (**), Italic (* or _), Code (`)
        // Stricter Regex:
        // 1. Code: `...`
        // 2. Bold: **...** (Must not start or end with space)
        // 3. Italic: *...* or _..._ (Must not start or end with space)
        
        // Note: We use non-greedy matching .*? and check boundaries
        const markdownRegex = /(`[^`]+`|\*\*(?!\s).*?(?<!\s)\*\*|\*(?!\s).*?(?<!\s)\*|_(?!\s).*?(?<!\s)_)/g;
        
        const textSegments = part.content.split(markdownRegex);

        return (
            <span key={index}>
                {textSegments.map((seg, i) => {
                    if (seg.startsWith('`') && seg.endsWith('`')) {
                        return (
                            <code key={i} className="bg-black/10 rounded px-1.5 py-0.5 font-mono text-[0.9em] mx-0.5 border border-black/5">
                                {seg.slice(1, -1)}
                            </code>
                        );
                    }
                    if (seg.startsWith('**') && seg.endsWith('**')) {
                        return <strong key={i} className="font-bold text-inherit">{seg.slice(2, -2)}</strong>;
                    }
                    // Check for italics (* or _)
                    if ((seg.startsWith('*') && seg.endsWith('*')) || (seg.startsWith('_') && seg.endsWith('_'))) {
                         // Double check it's not actually just a single asterisk or underscore if regex failed (unlikely with this split but safe to check)
                         if (seg.length > 2) {
                             return <em key={i} className="italic text-inherit">{seg.slice(1, -1)}</em>;
                         }
                    }
                    return <span key={i}>{seg}</span>;
                })}
            </span>
        );
      })}
    </span>
  );
};
