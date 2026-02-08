"use client";

import { useState } from "react";

type AdminControlsProps = {
  gameId: string;
  locked: boolean;
  onReset: () => Promise<void>;
  onPopulate: () => Promise<void>;
  onLock: () => Promise<void>;
  onUnlock: () => Promise<void>;
  disabled?: boolean;
};

const UNLOCK_CONFIRM_MESSAGE =
  "Unlock the board? You will be able to reset and populate numbers.";

const AdminControls = ({
  gameId,
  locked,
  onReset,
  onPopulate,
  onLock,
  onUnlock,
  disabled = false,
}: AdminControlsProps) => {
  const [isResetting, setIsResetting] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const actionsDisabled = locked || disabled;

  const handleReset = async () => {
    if (isResetting || actionsDisabled) return;
    setIsResetting(true);
    try {
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  const handlePopulate = async () => {
    if (isPopulating || actionsDisabled) return;
    setIsPopulating(true);
    try {
      await onPopulate();
    } finally {
      setIsPopulating(false);
    }
  };

  const handleLock = async () => {
    if (isLocking || disabled) return;
    setIsLocking(true);
    try {
      await onLock();
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlock = () => {
    if (isLocking || disabled) return;
    const confirmed = window.confirm(UNLOCK_CONFIRM_MESSAGE);
    if (!confirmed) return;
    setIsLocking(true);
    onUnlock().finally(() => setIsLocking(false));
  };

  const handleCopyLink = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/game/${gameId}`
        : "";
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {});
  };

  const LinkIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-nfl-charcoal rounded-xl border border-gray-700"
      role="group"
      aria-label="Admin controls"
    >
      <span className="text-xs uppercase tracking-wider text-gray-400 shrink-0">
        Admin
      </span>
      {locked && (
        <span
          className="text-amber-400 text-sm font-medium"
          role="status"
          aria-label="Board is locked"
        >
          Board locked
        </span>
      )}
      <button
        type="button"
        onClick={handleReset}
        disabled={actionsDisabled || isResetting}
        className="rounded-lg border border-red-500/70 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 min-h-touch"
        aria-label="Clear game: clear all squares and numbers"
        title={locked ? "Unlock the board to clear" : undefined}
      >
        {isResetting ? "Clearing…" : "Clear"}
      </button>
      <button
        type="button"
        onClick={handlePopulate}
        disabled={actionsDisabled || isPopulating}
        className="rounded-lg border border-nfl-seahawks-accent px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-nfl-seahawks-accent hover:bg-nfl-seahawks-accent/10 disabled:opacity-50 min-h-touch"
        aria-label="Populate numbers for rows and columns"
        title={locked ? "Unlock the board to populate" : undefined}
      >
        {isPopulating ? "Populating…" : "Populate"}
      </button>
      {locked ? (
        <button
          type="button"
          onClick={handleUnlock}
          disabled={disabled || isLocking}
          className="rounded-lg border border-amber-500/70 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 min-h-touch"
          aria-label="Unlock board to allow reset and populate numbers"
        >
          {isLocking ? "Unlocking…" : "Unlock"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLock}
          disabled={disabled || isLocking}
          className="rounded-lg border border-amber-500/70 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 min-h-touch"
          aria-label="Lock board to prevent accidental reset or populate"
        >
          {isLocking ? "Locking…" : "Lock"}
        </button>
      )}
      <button
        type="button"
        onClick={handleCopyLink}
        className="ml-auto rounded-lg border border-gray-500 p-2 min-h-touch min-w-touch flex items-center justify-center text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
        aria-label={copySuccess ? "Link copied" : "Copy game link"}
        title={copySuccess ? "Copied!" : "Copy game link"}
      >
        {copySuccess ? (
          <span className="text-green-400">
            <CheckIcon />
          </span>
        ) : (
          <LinkIcon />
        )}
      </button>
    </div>
  );
};

export default AdminControls;
