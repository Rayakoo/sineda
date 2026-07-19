"use client";

import { useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarBtn = { icon: string; cmd: string; title: string };

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const updating = useRef(false);

  useEffect(() => {
    if (!editorRef.current || updating.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      updating.current = true;
      onChange(editorRef.current.innerHTML);
      requestAnimationFrame(() => { updating.current = false; });
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    updating.current = true;
    onChange(editorRef.current.innerHTML);
    requestAnimationFrame(() => { updating.current = false; });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (document.queryCommandState("insertUnorderedList") || document.queryCommandState("insertOrderedList")) {
        exec("indent");
      } else {
        exec("insertHTML", "&emsp;&emsp;");
      }
    }
  };

  const toolbar: (ToolbarBtn | "divider")[] = [
    { icon: "fa-bold", cmd: "bold", title: "Bold (Ctrl+B)" },
    { icon: "fa-italic", cmd: "italic", title: "Italic (Ctrl+I)" },
    { icon: "fa-underline", cmd: "underline", title: "Underline (Ctrl+U)" },
    "divider",
    { icon: "fa-list-ul", cmd: "insertUnorderedList", title: "Bullet List" },
    { icon: "fa-list-ol", cmd: "insertOrderedList", title: "Numbered List" },
    "divider",
    { icon: "fa-link", cmd: "link", title: "Link" },
    "divider",
    { icon: "fa-align-left", cmd: "justifyLeft", title: "Align Left" },
    { icon: "fa-align-center", cmd: "justifyCenter", title: "Align Center" },
    { icon: "fa-align-right", cmd: "justifyRight", title: "Align Right" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:border-[#005696] transition-all">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1 flex-wrap">
        {toolbar.map((item, i) =>
          item === "divider" ? (
            <div key={i} className="w-px h-5 bg-gray-300 mx-1" />
          ) : (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (item.cmd === "link") {
                  const url = prompt("Masukkan URL:");
                  if (url) exec("createLink", url);
                } else {
                  exec(item.cmd);
                }
              }}
              title={item.title}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <i className={`fas ${item.icon} text-sm`}></i>
            </button>
          )
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="w-full p-4 text-sm focus:outline-none text-gray-700 overflow-y-auto leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1"
        style={{ minHeight }}
      />
    </div>
  );
}
