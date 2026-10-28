"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, Plus } from "lucide-react";
import { theme } from "@/constants/theme";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

interface BookControlsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  confirmationMessage?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onComplete?: () => void;
  onMarkAsFinished?: () => void;
}

export default function BookControls({
  onEdit,
  onDelete,
  confirmationMessage = "Are you sure you want to delete this book?",
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  onComplete,
  onMarkAsFinished,
}: BookControlsProps) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  return (
    <>
    <div className="flex gap-3">
      {/* EDIT */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
          className="control-btn edit-btn"
        >
          <Pencil size={18} className="icon" />
        </button>
      )}

      {/* MARK AS FINISHED */}
      {onMarkAsFinished && (
        <button
          type="button"
          title="Mark as finished"
          aria-label="Mark as finished"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkAsFinished();
          }}
          className="control-btn finish-btn"
        >
          <span className="finish-icon" aria-hidden="true">
            <Plus size={18} />
          </span>
        </button>
      )}

      {/* COMPLETE */}
      {onComplete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onComplete();
          }}
          className="control-btn complete-btn"
        >
          <Check size={18} className="icon" />
        </button>
      )}

      {/* DELETE */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDeleteConfirmationOpen(true);
          }}
          type="button"
          title="Delete book"
          aria-label="Delete book"
          className="control-btn delete-btn"
        >
          <Trash2 size={18} className="icon" />
        </button>
      )}

      {/* STYLES */}
      <style jsx>{`
        .control-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        /* EDIT BUTTON - Theme Sidebar Color */
        .edit-btn {
          background: ${theme.colors.sidebarBg}CC;
          border-color: ${theme.colors.sidebarBg};
        }
        .edit-btn:hover {
          background: ${theme.colors.accentHover};
          transform: scale(1.1);
        }

        /* COMPLETE BUTTON - Theme Accent */
        .complete-btn {
          background: ${theme.colors.accent}CC;
          border-color: ${theme.colors.accent};
        }
        .complete-btn:hover {
          background: ${theme.colors.accentHover};
          transform: scale(1.1);
        }

        .finish-btn {
          position: relative;
          overflow: hidden;
          background: ${theme.colors.cardBg};
          border-color: ${theme.colors.accentHover};
          color: ${theme.colors.accentHover};
        }
        .finish-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: ${theme.colors.accentHover};
          transform: scale(0);
          transition: transform 0.28s ease;
        }
        .finish-btn:hover {
          transform: scale(1.1);
        }
        .finish-icon {
          position: relative;
          z-index: 1;
          display: flex;
          transition: color 0.15s ease;
        }
        /* DELETE BUTTON - Universal Soft Red */
        .delete-btn {
          background: ${theme.colors.coral}CC;
          border-color: ${theme.colors.coral};
        }
        .delete-btn:hover {
          background: #C85B43;
          transform: scale(1.1);
        }

        .icon {
          color: white;
        }
      `}</style>
    </div>
    {onDelete && (
      <ConfirmationDialog
        open={isDeleteConfirmationOpen}
        title="Delete book?"
        message={confirmationMessage}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        onCancel={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmationOpen(false);
          onDelete();
        }}
      />
    )}
    </>
  );
}
