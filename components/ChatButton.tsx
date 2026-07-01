"use client";

import { useState, useRef, Suspense } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { MessageCircle, X, Minus, Maximize2, GripHorizontal } from "lucide-react";
import { ChatInterface } from "./ChatInterface";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Track if a drag just occurred to prevent click-after-drag toggling
  const hasDragged = useRef(false);

  return (
    <>
      {/* Full-page drag constraint layer */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* Floating button — always visible */}
      <motion.div
        drag
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => { hasDragged.current = false; }}
        onDrag={() => { hasDragged.current = true; }}
        className="fixed bottom-6 right-6 z-50"
        style={{ touchAction: "none" }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!hasDragged.current) {
              setIsOpen(!isOpen);
              setIsMinimized(false);
            }
            hasDragged.current = false;
          }}
          onPointerDown={(e) => dragControls.start(e)}
          className={`
            relative flex items-center justify-center gap-2 rounded-full shadow-2xl transition-all duration-300
            ${isOpen
              ? "bg-red-500 hover:bg-red-600 w-14 h-14"
              : "bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 h-14"
            }
          `}
          title="Discussion – Faites glisser pour déplacer"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-bold pr-1">Discussion</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Chat window — positioned bottom-right, above the button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-200/50 bg-white"
            style={{
              right: 16,
              bottom: 88,
              width: "min(520px, calc(100vw - 32px))",
              height: isMinimized ? 56 : "min(640px, calc(100vh - 112px))",
              transition: "height 0.25s ease",
            }}
          >
            {/* Window header with controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                <GripHorizontal className="w-4 h-4 text-white/50" />
                <span className="text-white font-bold text-sm">Messagerie</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all"
                  title={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat content */}
            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={
                  <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4 bg-slate-50/50">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-500">Chargement du chat...</p>
                  </div>
                }>
                  <ChatInterface />
                </Suspense>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
